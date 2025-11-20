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
    }
  ];
  
  /**
   * Simulates the "Retrieval" step of RAG.
   * Finds relevant documents based on the current context keywords.
   */
  export const retrieveRelevantProtocols = (contextKeywords: string[]): ProtocolDocument[] => {
    // Simple keyword matching simulation
    const relevantDocs = HOSPITAL_PROTOCOLS.filter(doc => 
      doc.tags.some(tag => contextKeywords.includes(tag))
    );
    
    // Dedup and return
    return [...new Set(relevantDocs)];
  };