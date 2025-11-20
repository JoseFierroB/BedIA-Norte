import { GoogleGenAI, Type } from "@google/genai";
import { HospitalState, ServiceData, ServiceType } from "../types";

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

/**
 * Agent Capability 1: Predictive Analysis
 * Takes current snapshot and uses reasoning to predict flow and suggest actions.
 */
export const analyzeHospitalState = async (services: ServiceData[]) => {
  const context = formatHospitalContext(services);
  
  const systemInstruction = `
    You are BedAI, an intelligent bed management assistant for Hospital San José. 
    Your goal is to help the Bed Manager (Gestor de Camas) optimize flow.
    
    Context: 
    - The hospital has no electronic records (HIS). Data is manual.
    - Urgency (ER) is usually collapsed.
    - You need to identify bottlenecks and suggest movements.
    
    Task:
    1. Assess the global risk level (Low, Medium, Critical).
    2. Predict total discharges in next 24h (combine manual input with a heuristic factor of ~10% variation).
    3. Give 3 concrete recommendations for bed assignment or derivation.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Current Hospital Status (JSON): ${context}`,
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

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Analysis failed", error);
    throw error;
  }
};

/**
 * Agent Capability 2: Automated Official Reporting
 * Generates the text required for the daily report to the Health Service Direction.
 */
export const generateOfficialReport = async (services: ServiceData[]) => {
  const context = formatHospitalContext(services);
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate the "Reporte Diario de Gestión de Camas" based on this data: ${context}`,
      config: {
        systemInstruction: "You are a strict administrative assistant. Generate a formal, concise report in Spanish for the Hospital Director and SSMN. Focus on critical nodes, occupancy rates, and immediate needs. Do not use markdown formatting, just plain text paragraphs.",
        temperature: 0.3
      }
    });
    return response.text;
  } catch (error) {
    console.error("Report generation failed", error);
    return "Error generando el reporte. Por favor intente nuevamente.";
  }
};

/**
 * Agent Capability 3: Natural Language Query
 * Allows the user to ask specific questions about the data.
 */
export const chatWithBedAgent = async (history: any[], currentServices: ServiceData[], userMessage: string) => {
  const context = formatHospitalContext(currentServices);
  
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are BedAI. You have access to real-time hospital bed data: ${context}. Answer the nurse's questions briefly and helpfully. If asked about available beds, specify the service.`
    },
    history: history
  });

  const result = await chat.sendMessage({ message: userMessage });
  return result.text;
};