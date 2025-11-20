/**
 * RAG SYSTEM (Retrieval-Augmented Generation)
 * 
 * This mocks a vector database or document store.
 * In a full production environment, this would connect to Pinecone, ChromaDB, or similar.
 * Here, we perform keyword-based retrieval to inject institutional knowledge into the LLM.
 */

interface ProtocolDocument {
    id: string;
    title: string;
    tags: string[];
    content: string;
  }

interface GRDMaster {
    code: string;
    name: string;
    avgStay: number; // Days
    complexity: 'Alta' | 'Media' | 'Baja';
}
  
  const HOSPITAL_PROTOCOLS: ProtocolDocument[] = [
    {
      id: 'prot-001',
      title: 'Protocolo de Colapso en Urgencia',
      tags: ['urgencia', 'colapso', 'saturación', 'critico'],
      content: 'ACTIVAR CÓDIGO DE GESTIÓN: 1. Suspender cirugías electivas. 2. Habilitar pasillos de transición en Medicina. 3. Priorizar altas médicas antes de las 11:00 AM. 4. Evaluar traslado a red extra-hospitalaria.'
    },
    {
      id: 'prot-002',
      title: 'Criterios de Gestión UPC',
      tags: ['upc', 'uci', 'uti', 'critico'],
      content: 'Para optimizar flujo UPC: Pacientes con estabilidad hemodinámica > 24h deben ser trasladados a Intermedio o Medicina ("Step-down"). Revisar diariamente pacientes con criterios de salida.'
    },
    {
      id: 'prot-003',
      title: 'Bloqueo de Camas',
      tags: ['bloqueo', 'mantenimiento', 'aislamiento'],
      content: 'El bloqueo de camas por aislamiento debe ser re-evaluado cada 12 horas por IAAS. Camas bloqueadas por falla técnica deben tener orden de trabajo activa en Ingeniería.'
    },
    {
      id: 'prot-004',
      title: 'Flujo Normal de Altas',
      tags: ['flujo', 'normal', 'bajo', 'medio'],
      content: 'Objetivo diario: Liberar 15% de capacidad total antes de las 13:00 hrs. Gestionar ambulancias para traslados a domicilio el día previo.'
    },
    {
      id: 'tpl-001',
      title: 'Template Epicrisis Estándar',
      tags: ['epicrisis', 'alta', 'documento'],
      content: 'FORMATO EPICRISIS: 1. Resumen Ingreso (Motivo). 2. Evolución Clínica (Hitos, complicaciones). 3. Procedimientos realizados. 4. Indicaciones al Alta (Fármacos, control). 5. Signos de Alarma.'
    }
  ];

  // Mock GRD Database for Diagnosis Related Groups
  export const GRD_DATABASE: GRDMaster[] = [
      { code: 'GRD-121', name: 'Insuficiencia Cardíaca con CC', avgStay: 5.2, complexity: 'Alta' },
      { code: 'GRD-089', name: 'Neumonía Simple / Pleuresía > 17 años', avgStay: 4.1, complexity: 'Media' },
      { code: 'GRD-330', name: 'Apendicectomía Complicada', avgStay: 3.5, complexity: 'Media' },
      { code: 'GRD-880', name: 'Accidente Cerebrovascular Isquémico', avgStay: 6.8, complexity: 'Alta' },
      { code: 'GRD-035', name: 'Trastornos de la Vesícula Biliar', avgStay: 2.1, complexity: 'Baja' },
      { code: 'GRD-540', name: 'Infecciones Renales y Urinarias', avgStay: 3.8, complexity: 'Media' }
  ];
  
  /**
   * Simulates the "Retrieval" step of RAG.
   * Finds relevant documents based on the current context keywords.
   */
  export const retrieveRelevantProtocols = (contextKeywords: string[]): ProtocolDocument[] => {
    // Simple keyword matching simulation
    const relevantDocs = HOSPITAL_PROTOCOLS.filter(doc => 
      doc.tags.some(tag => contextKeywords.includes(tag.toLowerCase()))
    );
    
    // Dedup and return
    return [...new Set(relevantDocs)];
  };

  export const findGRDMatch = (diagnosis: string): GRDMaster | undefined => {
      const lowerD = diagnosis.toLowerCase();
      return GRD_DATABASE.find(g => lowerD.includes(g.name.toLowerCase()) || g.name.toLowerCase().includes(lowerD));
  };