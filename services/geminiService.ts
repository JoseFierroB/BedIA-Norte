import { GoogleGenAI, Type } from "@google/genai";
import { HospitalState, ServiceData, ServiceType, AIAnalysis, RiskLevel, UnstructuredInsight, Patient, EpicrisisResult } from "../types";
import { runHeuristicModel } from "./mlEngine";
import { retrieveRelevantProtocols, GRD_DATABASE, findGRDMatch } from "./knowledgeBase";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to format data for the prompt
const formatHospitalContext = (data: ServiceData[]): string => {
  return JSON.stringify(data.map(s => ({
    service: s.name,
    capacity: `${s.occupiedBeds}/${s.totalBeds}`,
    blocked: s.blockedBeds,
    probable_discharges_manual: s.probableDischarges,
    waiting_patients: s.pendingAdmission
  })), null, 2);
};

// Utility to simulate processing time for better UX in prototype
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * ORCHESTRATOR: analyzeHospitalState
 * Existing function...
 */
export const analyzeHospitalState = async (
  services: ServiceData[], 
  onProgress?: (stage: string) => void
): Promise<AIAnalysis> => {
  
  // STEP 1: Run Classical ML (Deterministic/XGBoost Simulation)
  if (onProgress) onProgress('ML_ENGINE');
  await sleep(800); // Simulate calculation time
  
  const mlPrediction = runHeuristicModel(services);
  
  // STEP 2: RAG Retrieval
  if (onProgress) onProgress('RAG_RETRIEVAL');
  await sleep(800); // Simulate DB query time
  
  // Determine keywords based on ML findings
  const keywords = [];
  if (mlPrediction.calculatedRisk === RiskLevel.HIGH) keywords.push('colapso', 'critico');
  if (mlPrediction.criticalServices.includes(ServiceType.URGENCIA)) keywords.push('urgencia');
  if (mlPrediction.criticalServices.includes(ServiceType.UPC)) keywords.push('upc');
  if (keywords.length === 0) keywords.push('normal');

  const protocols = retrieveRelevantProtocols(keywords);
  const ragContext = protocols.map(p => `- ${p.title}: ${p.content}`).join('\n');

  // STEP 3: Construct Hybrid Prompt & Call LLM
  if (onProgress) onProgress('LLM_GENERATION');
  
  const context = formatHospitalContext(services);
  const systemInstruction = `
    You are BedAI, an advanced Orchestrator for Hospital San José.
    
    INPUT DATA SOURCES:
    1. Real-time Bed Data (JSON).
    2. ML Engine Analysis: Risk=${mlPrediction.calculatedRisk}, Critical Nodes=${mlPrediction.criticalServices.join(',')}.
    3. Institutional Protocols (RAG): 
    ${ragContext}

    TASK:
    Synthesize these inputs. 
    - Use the ML Risk Level as the absolute truth.
    - Use the Protocols to justify your recommendations.
    - Suggest 3 actionable moves.
  `;

  try {
    // Call LLM (Gemini 2.5 Flash)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Current Data: ${context}. ML Engine Stats: ${JSON.stringify(mlPrediction)}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            riskAssessment: {
              type: Type.OBJECT,
              properties: {
                level: { type: Type.STRING, enum: ["Bajo", "Medio", "Crítico"] },
                reasoning: { type: Type.STRING }
              }
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            predictedDischarges24h: { type: Type.NUMBER }
          }
        }
      }
    });

    const llmResult = JSON.parse(response.text || "{}");

    // Return Hybrid Result
    return {
      ...llmResult,
      metadata: {
        llmUsed: 'Gemini 2.5 Flash',
        ragDocuments: protocols.map(p => p.title),
        mlEngineUsed: true,
        fallbackMode: false
      }
    };

  } catch (error) {
    console.error("Primary LLM Failed, switching to Fallback Mode", error);
    
    // STEP 4: FALLBACK MODE
    return {
      summary: "⚠️ MODO DE CONTINGENCIA: Servicio de IA Generativa no disponible. Mostrando datos calculados por motor heurístico.",
      riskAssessment: {
        level: mlPrediction.calculatedRisk,
        reasoning: `Cálculo automático basado en saturación > ${(mlPrediction.systemStressScore * 100).toFixed(0)}% y nodos críticos: ${mlPrediction.criticalServices.join(', ') || 'Ninguno'}.`
      },
      recommendations: [
        "Revisar protocolos de gestión (Ver Documentación RAG).",
        "Priorizar altas en servicios con mayor demanda.",
        "Contactar soporte técnico para restablecer IA Generativa."
      ],
      predictedDischarges24h: mlPrediction.predictedDischarges,
      metadata: {
        llmUsed: 'None (Fallback)',
        ragDocuments: [],
        mlEngineUsed: true,
        fallbackMode: true
      }
    };
  }
};

// --- NEW AGENTIC FUNCTIONS ---

/**
 * 1. CONTEXT AGENT:
 * Parses unstructured text (WhatsApp logs, nurse notes) into actionable insights.
 */
export const parseUnstructuredContext = async (text: string): Promise<UnstructuredInsight[]> => {
  const systemInstruction = `
    You are a Clinical Coordination Assistant. 
    Extract structured insights from informal hospital chat logs or notes.
    Focus on: Bed blocking, cleaning status, social issues delaying discharge, or urgent transfers.
    Return a JSON list.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: text,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ['ALERT', 'BED_BLOCK', 'DISCHARGE', 'SOCIAL'] },
              description: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              actionItem: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error(e);
    return [];
  }
};

/**
 * 2. GRD AGENT:
 * Predicts Length of Stay and assigns a GRD based on diagnosis text.
 */
export const predictGRD = async (diagnosis: string, age: number) => {
  // Try exact match first (Simulated DB Lookup)
  const dbMatch = findGRDMatch(diagnosis);
  if (dbMatch) return { ...dbMatch, source: 'DB_EXACT' };

  // Fallback to AI for semantic matching
  const systemInstruction = `
    You are an Expert Medical Coder (GRD/DRG).
    Match the diagnosis to the closest GRD category.
    Estimate average length of stay (LOS).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Diagnosis: ${diagnosis}. Age: ${age}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            code: { type: Type.STRING },
            name: { type: Type.STRING },
            avgStay: { type: Type.NUMBER },
            complexity: { type: Type.STRING, enum: ['Alta', 'Media', 'Baja'] }
          }
        }
      }
    });
    return { ...JSON.parse(response.text || "{}"), source: 'AI_PREDICTED' };
  } catch (e) {
    return { code: 'GRD-UNK', name: 'No clasificado', avgStay: 3, complexity: 'Media', source: 'DEFAULT' };
  }
};

/**
 * 2.5. CLINICAL NOTES REFINEMENT AGENT
 * Cleans, organizes, and professionalizes raw clinical notes before they go into the Epicrisis.
 */
export const summarizeClinicalNotes = async (rawNotes: string): Promise<string> => {
  const systemInstruction = `
    You are a Clinical Documentation Specialist.
    Your task is to refine raw, informal clinical notes into a concise, professional summary suitable for a formal Discharge Summary (Epicrisis).
    - Remove subjective non-clinical comments.
    - Fix medical abbreviations and typos.
    - Organize chronologically or by system if applicable.
    - Keep it brief but complete.
    - Maintain professional medical Spanish.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: rawNotes,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "text/plain",
      }
    });
    return response.text || rawNotes;
  } catch (e) {
    console.error("Error cleaning notes:", e);
    return rawNotes; // Fallback to original if AI fails
  }
};

export interface CleaningAnalysis {
  protocol: 'RAPIDO' | 'TERMINAL';
  reasoning: string;
  estimatedMinutes: number;
}

/**
 * 2.6. CLEANING PROTOCOL AGENT
 * Analyzes patient diagnosis and notes to determine infectious risk and correct cleaning protocol.
 */
export const analyzeCleaningRequirements = async (diagnosis: string, notes: string): Promise<CleaningAnalysis> => {
  const systemInstruction = `
    You are a Hospital Infection Control Specialist.
    Analyze the patient diagnosis and clinical notes to determine the required Bed Cleaning Protocol after discharge.
    
    Rules:
    1. 'TERMINAL': If there is any mention of isolation (contact, droplet, airborne), multidrug-resistant organisms (MDR), Clostridium difficile, COVID-19, Tuberculosis, or open infected wounds.
    2. 'RAPIDO': For standard patients with no infectious risk.

    Output JSON:
    {
      "protocol": "RAPIDO" | "TERMINAL",
      "reasoning": "Brief explanation of risk factors found or lack thereof.",
      "estimatedMinutes": 20 (for RAPIDO) or 60 (for TERMINAL)
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Diagnosis: ${diagnosis}. Notes: ${notes}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            protocol: { type: Type.STRING, enum: ["RAPIDO", "TERMINAL"] },
            reasoning: { type: Type.STRING },
            estimatedMinutes: { type: Type.NUMBER }
          }
        }
      }
    });
    
    return JSON.parse(response.text || '{"protocol": "RAPIDO", "reasoning": "Default analysis.", "estimatedMinutes": 20}');
  } catch (e) {
    console.error("Cleaning analysis failed", e);
    return { protocol: 'TERMINAL', reasoning: 'Error in AI analysis, defaulting to deep clean for safety.', estimatedMinutes: 60 };
  }
};

/**
 * 3. EPICRISIS AGENT:
 * Generates a formal discharge summary based on patient notes.
 * Accepts an optional 'refinedNotes' parameter for pre-processed context.
 */
export const generateEpicrisisDraft = async (patient: Patient, refinedNotes?: string): Promise<EpicrisisResult> => {
  const template = retrieveRelevantProtocols(['epicrisis'])[0]?.content || "Standard Template";
  
  const notesToUse = refinedNotes || patient.clinicalNotes || "Sin antecedentes.";

  const prompt = `
    Generate a medical Epicrisis (Hospital Discharge Summary).
    Patient: ${patient.name}, ${patient.age}y.
    Diagnosis: ${patient.diagnosis}.
    GRD: ${patient.grdCluster?.name} (Estancia: ${patient.grdCluster?.avgDays} days).
    Context/Notes (Processed): ${notesToUse}.
    
    Template Guideline: ${template}

    Output JSON with:
    1. htmlContent: A clean, formatted HTML string (no markdown ticks) suitable for a div. Use <h3>, <p>, <ul>.
    2. summaryForTransfer: A short 2-line summary for WhatsApp coordination.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
       responseSchema: {
          type: Type.OBJECT,
          properties: {
            htmlContent: { type: Type.STRING },
            summaryForTransfer: { type: Type.STRING },
          }
        }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateOfficialReport = async (services: ServiceData[]) => {
  const context = formatHospitalContext(services);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate official report from: ${context}`,
      config: {
        systemInstruction: "Generate a formal 'Reporte Diario de Gestión de Camas' for the Health Service Director. Spanish. Professional tone.",
        temperature: 0.3
      }
    });
    return response.text;
  } catch (error) {
    return "Error: No se pudo generar el reporte narrativo debido a una falla en el servicio de IA.";
  }
};

export const chatWithBedAgent = async (history: any[], currentServices: ServiceData[], userMessage: string) => {
  const context = formatHospitalContext(currentServices);
  // Simple Chat wrapper
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are BedAI. Context: ${context}. Be helpful.`
    },
    history: history
  });

  const result = await chat.sendMessage({ message: userMessage });
  return result.text;
};

export interface NotificationAnalysis {
    shouldNotify: boolean;
    targetGroup: string; // e.g., 'Aseo', 'Enfermería', 'Médicos', 'Todos'
    priority: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
    reason: string;
}

/**
 * 4. CHAT NOTIFICATION ANALYZER
 * Analyzes chat messages for semantic intent to trigger automated broadcasts.
 * e.g., "@aseo cama 400 sucia" -> Triggers notification to Cleaning Staff.
 */
export const analyzeChatMessage = async (message: string, senderRole: string): Promise<NotificationAnalysis> => {
    const systemInstruction = `
      You are a Hospital Communications Dispatcher.
      Analyze the latest chat message.
      Determine if the user intends to notify a specific team or if the content is urgent enough to warrant an automated broadcast.
      Look for explicit mentions (using @) OR semantic meaning (e.g., "please clean bed 5" implies target="Aseo").

      If no specific action/notification is needed, set shouldNotify = false.

      Output JSON.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Sender: ${senderRole}. Message: "${message}"`,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              shouldNotify: { type: Type.BOOLEAN },
              targetGroup: { type: Type.STRING, description: "The team to notify, e.g. 'Personal de Aseo', 'Equipo Médico', 'Mantención', 'Gestión de Camas'" },
              priority: { type: Type.STRING, enum: ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'] },
              reason: { type: Type.STRING, description: "Short reason for the alert." }
            }
          }
        }
      });
      
      return JSON.parse(response.text || '{"shouldNotify": false}');
    } catch (e) {
      console.error("Chat analysis failed", e);
      return { shouldNotify: false, targetGroup: '', priority: 'BAJA', reason: '' };
    }
  };