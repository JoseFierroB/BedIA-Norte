export enum ServiceType {
  URGENCIA = 'Urgencia',
  MEDICINA = 'Medicina',
  CIRUGIA = 'Cirugía',
  UPC = 'UPC (UCI/UTI)',
  PABELLON = 'Pabellón',
  TRAUMATOLOGIA = 'Traumatología'
}

export enum RiskLevel {
  LOW = 'Bajo',
  MEDIUM = 'Medio',
  HIGH = 'Crítico'
}

export interface ServiceData {
  id: string;
  name: ServiceType;
  totalBeds: number;
  occupiedBeds: number;
  blockedBeds: number;
  probableDischarges: number; // Altas probables (Input manual)
  pendingAdmission: number; // Pacientes esperando cama
}

export interface HospitalState {
  services: ServiceData[];
  lastUpdated: Date;
}

// Metadata to track which AI systems contributed to the answer
export interface AIModelMetadata {
  llmUsed: string; // e.g., "Gemini 2.5 Flash", "Llama-3 (Fallback)"
  ragDocuments: string[]; // Protocol titles retrieved
  mlEngineUsed: boolean; // Was the XGBoost/Heuristic engine used?
  fallbackMode: boolean; // True if the primary LLM failed and we are showing raw ML data
}

// Structure for the AI Agent's analysis
export interface AIAnalysis {
  summary: string;
  riskAssessment: {
    level: RiskLevel;
    reasoning: string;
  };
  recommendations: string[];
  predictedDischarges24h: number;
  metadata: AIModelMetadata; // Added metadata
}

// Input for the chat interface
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}