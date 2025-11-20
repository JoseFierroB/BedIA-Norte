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

// --- NEW TYPES FOR AGENTIC FLOW ---

export interface Patient {
  id: string;
  name: string; // Initials or Anonymized
  age: number;
  diagnosis: string;
  admissionDate: Date;
  bedNumber: string;
  status: 'HOSPITALIZADO' | 'PRE_ALTA' | 'ALTA_DIGITAL' | 'TRASLADO_PENDIENTE';
  grdCluster?: {
    code: string;
    name: string;
    avgDays: number;
    complexity: 'Baja' | 'Media' | 'Alta';
  };
  clinicalNotes?: string; // Context for Epicrisis
}

export interface UnstructuredInsight {
  type: 'ALERT' | 'BED_BLOCK' | 'DISCHARGE' | 'SOCIAL';
  description: string;
  confidence: number;
  actionItem: string;
}

export interface EpicrisisResult {
  htmlContent: string; // Formatted document
  summaryForTransfer: string; // Short version for WhatsApp/Radio
}