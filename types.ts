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

// Structure for the AI Agent's analysis
export interface AIAnalysis {
  summary: string;
  riskAssessment: {
    level: RiskLevel;
    reasoning: string;
  };
  recommendations: string[];
  predictedDischarges24h: number; // AI Prediction based on history logic
}

// Input for the chat interface
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}