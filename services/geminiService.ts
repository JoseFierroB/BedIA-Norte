import { GoogleGenAI, Type } from "@google/genai";
import { HospitalState, ServiceData, ServiceType, AIAnalysis, RiskLevel } from "../types";
import { runHeuristicModel } from "./mlEngine";
import { retrieveRelevantProtocols } from "./knowledgeBase";

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
 * 
 * This function acts as the "Brain" that coordinates:
 * 1. Classical ML (via mlEngine) for hard math and risk scoring.
 * 2. RAG (via knowledgeBase) for institutional protocols.
 * 3. LLM (Gemini) for synthesis and natural language generation.
 * 4. Fallback logic if the LLM fails.
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