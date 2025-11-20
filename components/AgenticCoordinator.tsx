import React, { useState, useEffect } from 'react';
import { Patient, UnstructuredInsight, EpicrisisResult, RiskLevel } from '../types';
import { parseUnstructuredContext, predictGRD, generateEpicrisisDraft, summarizeClinicalNotes, analyzeCleaningRequirements, CleaningAnalysis } from '../services/geminiService';
import { 
  MessageSquare, 
  Zap, 
  FileText, 
  Users, 
  BrainCircuit, 
  ClipboardCheck, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Sparkles,
  X,
  Loader2,
  Calculator,
  SprayCan, // Represents cleaning
  ArrowRight,
  Timer,
  ShieldAlert,
  Play,
  CheckSquare
} from 'lucide-react';

// Mock Initial Patients for Urgency
const MOCK_PATIENTS: Patient[] = [
  { id: 'p1', name: 'J.P.L.', age: 68, diagnosis: 'Neumonía (No Aislamiento)', admissionDate: new Date(Date.now() - 86400000 * 2), bedNumber: 'URG-04', status: 'HOSPITALIZADO', clinicalNotes: 'Estable. PCR Negativo. Sin aislamiento de contacto.' },
  { id: 'p2', name: 'M.A.R.', age: 45, diagnosis: 'Apendicitis', admissionDate: new Date(Date.now() - 86400000 * 1), bedNumber: 'URG-08', status: 'PRE_ALTA', clinicalNotes: 'Herida limpia. Sin antecedentes infecciosos.' },
  { id: 'p3', name: 'S.T.V.', age: 82, diagnosis: 'Diarrea por C. Difficile', admissionDate: new Date(Date.now() - 86400000 * 4), bedNumber: 'URG-01', status: 'HOSPITALIZADO', clinicalNotes: 'AISLAMIENTO DE CONTACTO. Precaución estricta.' },
];

interface CleaningTask {
  id: string;
  bedNumber: string;
  protocol: 'RAPIDO' | 'TERMINAL';
  reasoning: string;
  priority: 'ALTA' | 'MEDIA' | 'BAJA';
  estimatedTime: number; // minutes
  status: 'PENDIENTE' | 'EN_PROCESO' | 'LISTA';
  patientContext: string; // Previous diagnosis for reference
}

const AgenticCoordinator: React.FC = () => {
  // STATE
  const [unstructuredText, setUnstructuredText] = useState('');
  const [insights, setInsights] = useState<UnstructuredInsight[]>([]);
  const [analyzingText, setAnalyzingText] = useState(false);
  
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  const [epicrisisResult, setEpicrisisResult] = useState<EpicrisisResult | null>(null);
  const [cleaningAnalysis, setCleaningAnalysis] = useState<CleaningAnalysis | null>(null); // New State for Cleaning AI
  const [generatingDoc, setGeneratingDoc] = useState(false);
  const [processingMessage, setProcessingMessage] = useState(''); 
  
  const [showToast, setShowToast] = useState(false);

  // Manual GRD Calculator State
  const [grdDiagnosis, setGrdDiagnosis] = useState('');
  const [grdAge, setGrdAge] = useState('');
  const [grdResult, setGrdResult] = useState<any>(null);
  const [loadingGrd, setLoadingGrd] = useState(false);

  // NEW: Cleaning Queue State
  const [cleaningQueue, setCleaningQueue] = useState<CleaningTask[]>([]);

  // --- 1. CONTEXT AGENT LOGIC ---
  const handleAnalyzeContext = async () => {
    if (!unstructuredText) return;
    setAnalyzingText(true);
    const results = await parseUnstructuredContext(unstructuredText);
    setInsights(results);
    setAnalyzingText(false);
  };

  const applyAction = (action: string) => {
    setInsights(prev => prev.filter(i => i.actionItem !== action));
  };

  // --- 2. GRD AGENT LOGIC (AUTOMATIC & MANUAL) ---
  useEffect(() => {
    const enrichPatients = async () => {
      const updated = [...patients];
      let changed = false;
      
      for (let i = 0; i < updated.length; i++) {
        if (!updated[i].grdCluster) {
          const grd = await predictGRD(updated[i].diagnosis, updated[i].age);
          updated[i].grdCluster = {
            code: grd.code,
            name: grd.name,
            avgDays: grd.avgStay,
            complexity: grd.complexity as any
          };
          changed = true;
        }
      }
      
      if (changed) setPatients(updated);
    };
    enrichPatients();
  }, []);

  const handlePredictGRD = async () => {
    if(!grdDiagnosis || !grdAge) return;
    setLoadingGrd(true);
    try {
      const res = await predictGRD(grdDiagnosis, parseInt(grdAge));
      setGrdResult(res);
    } catch(e) {
      console.error(e);
    } finally {
      setLoadingGrd(false);
    }
  };

  // --- 3. EPICRISIS & CLEANING LOGIC ---
  const handleGenerateEpicrisis = async (patient: Patient) => {
    setSelectedPatient(patient);
    setGeneratingDoc(true);
    setEpicrisisResult(null);
    setCleaningAnalysis(null);
    
    try {
      // 1. Refine Notes
      setProcessingMessage('Refinando notas clínicas y estandarizando terminología...');
      const refinedNotes = await summarizeClinicalNotes(patient.clinicalNotes || "");
      
      // 2. Parallel Execution: Generate Document + Analyze Cleaning Needs
      setProcessingMessage('Generando documento y analizando protocolo de aseo...');
      
      const [docResult, cleanResult] = await Promise.all([
        generateEpicrisisDraft(patient, refinedNotes),
        analyzeCleaningRequirements(patient.diagnosis, patient.clinicalNotes || "")
      ]);
      
      setEpicrisisResult(docResult);
      setCleaningAnalysis(cleanResult);

    } catch (e) {
      console.error("Error generating epicrisis/analysis", e);
    } finally {
      setGeneratingDoc(false);
      setProcessingMessage('');
    }
  };

  const handleDigitalDischarge = () => {
    if (!selectedPatient) return;
    
    // 1. Generate Cleaning Task using the AI Analysis found during epicrisis generation
    const cleaningTask: CleaningTask = {
      id: Date.now().toString(),
      bedNumber: selectedPatient.bedNumber,
      protocol: cleaningAnalysis?.protocol || 'TERMINAL',
      reasoning: cleaningAnalysis?.reasoning || 'Protocolo preventivo por defecto (Fallo IA)',
      priority: 'ALTA', 
      estimatedTime: cleaningAnalysis?.estimatedMinutes || 60,
      status: 'PENDIENTE',
      patientContext: selectedPatient.diagnosis
    };

    setCleaningQueue(prev => [cleaningTask, ...prev]);

    // 2. Remove patient from active list (simulating discharge)
    setPatients(prev => prev.filter(p => p.id !== selectedPatient.id));
    
    // 3. Clear selection and analysis state
    setEpicrisisResult(null);
    setCleaningAnalysis(null);
    setSelectedPatient(null);
    
    // 4. Feedback
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAdvanceStatus = (taskId: string) => {
    setCleaningQueue(prev => {
      return prev.reduce((acc, task) => {
        if (task.id === taskId) {
          if (task.status === 'PENDIENTE') {
            acc.push({ ...task, status: 'EN_PROCESO' });
          } else if (task.status === 'EN_PROCESO') {
            acc.push({ ...task, status: 'LISTA' });
          } 
          // If LISTA, don't push (remove from queue)
        } else {
          acc.push(task);
        }
        return acc;
      }, [] as CleaningTask[]);
    });
  };

  // UI Helpers for Progress Bar
  const getProgressConfig = (status: string) => {
    switch (status) {
      case 'PENDIENTE':
        return { width: 'w-1/3', color: 'bg-green-500', label: 'Pendiente', btnText: 'Iniciar Aseo', btnIcon: Play };
      case 'EN_PROCESO':
        return { width: 'w-2/3', color: 'bg-blue-500', label: 'En Proceso', btnText: 'Terminar', btnIcon: Loader2 };
      case 'LISTA':
        return { width: 'w-full', color: 'bg-yellow-400', label: 'Lista', btnText: 'Habilitar Cama', btnIcon: CheckSquare };
      default:
        return { width: 'w-0', color: 'bg-slate-200', label: 'Desconocido', btnText: 'Acción', btnIcon: Play };
    }
  };

  // RENDER HELPERS
  const getComplexityColor = (comp?: string) => {
    if (comp === 'Alta') return 'bg-red-100 text-red-700 border-red-200';
    if (comp === 'Media') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  return (
    <div className="pb-20 space-y-6 relative">
      
      {/* TOAST NOTIFICATION */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-10 fade-in z-[100]">
          <div className="bg-green-500 rounded-full p-1">
            <CheckCircle2 size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-base">Alta Procesada</p>
            <p className="text-xs text-slate-300">Cama enviada a cola de aseo prioritario.</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
          <BrainCircuit size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Coordinador de Flujo Agéntico</h2>
          <p className="text-sm text-slate-500">Optimización de Alta • Triage de Aseo • Disponibilidad Rápida</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: CLEANING & MAINTENANCE QUEUE (Optimized Flow) */}
        <div className="xl:col-span-4 space-y-6 order-2 xl:order-1">
          
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 p-5 rounded-2xl border border-teal-100 shadow-sm">
             <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-teal-100 text-teal-700 rounded-lg">
                  <SprayCan size={20} />
                </div>
                <h3 className="font-bold text-teal-900">Cola Inteligente de Aseo</h3>
             </div>
             <p className="text-sm text-teal-700 mb-4 leading-relaxed">
               El sistema asigna protocolos de limpieza diferenciados según el riesgo infeccioso del paciente previo.
             </p>
             
             {cleaningQueue.length === 0 ? (
               <div className="bg-white/60 rounded-xl p-8 text-center border border-dashed border-teal-200">
                  <Sparkles className="mx-auto text-teal-300 mb-2" size={32} />
                  <p className="text-sm text-teal-600 font-medium">Sin camas pendientes de aseo</p>
               </div>
             ) : (
               <div className="space-y-3">
                  {cleaningQueue.map(task => {
                    const config = getProgressConfig(task.status);
                    const BtnIcon = config.btnIcon;
                    
                    return (
                      <div key={task.id} className="bg-white p-4 rounded-xl border border-teal-100 shadow-sm animate-in slide-in-from-left-4 relative overflow-hidden">
                         {/* Protocol Stripe */}
                         <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${task.protocol === 'TERMINAL' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                         
                         <div className="pl-3">
                           <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-lg text-slate-800">{task.bedNumber}</span>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${task.protocol === 'TERMINAL' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                                {task.protocol === 'TERMINAL' ? 'Aseo Terminal' : 'Aseo Rápido'}
                              </span>
                           </div>
                           
                           <p className="text-xs text-slate-500 mb-2 italic">Contexto: {task.patientContext}</p>
                           
                           <div className="flex items-center gap-2 mb-3 bg-slate-50 p-2 rounded-lg">
                              <ShieldAlert size={14} className={task.protocol === 'TERMINAL' ? 'text-red-500' : 'text-green-500'} />
                              <p className="text-xs font-medium text-slate-700 leading-tight">{task.reasoning}</p>
                           </div>
  
                           {/* Progress Bar */}
                           <div className="mb-3">
                              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-1">
                                <span>Estado: {config.label}</span>
                                <span>{task.status === 'PENDIENTE' ? '0%' : task.status === 'EN_PROCESO' ? '50%' : '100%'}</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-500 ease-out ${config.width} ${config.color}`}></div>
                              </div>
                           </div>
  
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-slate-500 text-xs font-mono">
                                 <Timer size={14} />
                                 <span>~{task.estimatedTime} min</span>
                              </div>
                              <button 
                                onClick={() => handleAdvanceStatus(task.id)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors shadow-sm flex items-center gap-1.5 text-white
                                  ${task.status === 'LISTA' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-teal-600 hover:bg-teal-700'}
                                `}
                              >
                                <BtnIcon size={12} className={task.status === 'EN_PROCESO' ? 'animate-spin' : ''} />
                                {config.btnText}
                              </button>
                           </div>
                         </div>
                      </div>
                    );
                  })}
               </div>
             )}
          </div>

          {/* MANUAL GRD TOOL (Kept for context) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-2 mb-4">
               <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                 <Calculator size={20} />
               </div>
               <h3 className="font-bold text-slate-700">Calculadora GRD Manual</h3>
             </div>
             <div className="space-y-3 opacity-80">
               <input 
                 type="text"
                 value={grdDiagnosis}
                 onChange={(e) => setGrdDiagnosis(e.target.value)}
                 placeholder="Diagnóstico..."
                 className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm"
               />
               <input 
                 type="number"
                 value={grdAge}
                 onChange={(e) => setGrdAge(e.target.value)}
                 placeholder="Edad..."
                 className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm"
               />
               <button 
                 onClick={handlePredictGRD}
                 disabled={loadingGrd || !grdDiagnosis || !grdAge}
                 className="w-full py-2.5 bg-slate-800 text-white font-bold rounded-lg text-xs"
               >
                 {loadingGrd ? 'Calculando...' : 'Predecir'}
               </button>
             </div>
             {grdResult && (
               <div className="mt-3 pt-3 border-t border-slate-100">
                 <p className="text-xs font-bold text-slate-700">{grdResult.code} - {grdResult.avgStay} días</p>
               </div>
             )}
          </div>
        </div>

        {/* RIGHT COLUMN: PATIENT LIST (Source of Flow) */}
        <div className="xl:col-span-8 space-y-6 order-1 xl:order-2">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Users className="text-indigo-600" size={20} />
                <h3 className="font-bold text-slate-700">Pacientes Candidatos a Alta</h3>
              </div>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">{patients.length} Pendientes</span>
            </div>

            <div className="divide-y divide-slate-100">
              {patients.map((patient) => (
                <div key={patient.id} className="p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Patient Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg shrink-0 border border-indigo-100">
                        {patient.bedNumber.split('-')[1]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-lg">{patient.name}</h4>
                          <span className="text-xs text-slate-500 bg-slate-100 px-1.5 rounded">{patient.age} años</span>
                        </div>
                        <p className="text-slate-600 font-medium">{patient.diagnosis}</p>
                        
                        {/* Context Indicator for Cleaning */}
                        <div className="flex items-center gap-2 mt-2">
                           {patient.clinicalNotes?.toUpperCase().includes("AISLAMIENTO") ? (
                             <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                               <ShieldAlert size={10} /> Aislamiento (Requiere Aseo Terminal)
                             </span>
                           ) : (
                             <span className="text-[10px] bg-green-50 text-green-600 border border-green-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                               <Sparkles size={10} /> Estándar (Apto Aseo Rápido)
                             </span>
                           )}
                        </div>
                      </div>
                    </div>

                    {/* Action Area */}
                    <div className="flex flex-col gap-2 min-w-[140px]">
                       <button 
                         onClick={() => handleGenerateEpicrisis(patient)}
                         className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 font-semibold py-2 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                       >
                         <FileText size={16} />
                         Gestionar Alta
                       </button>
                    </div>

                  </div>
                </div>
              ))}
              {patients.length === 0 && (
                 <div className="p-10 text-center text-slate-400 italic">
                    No hay pacientes pendientes de alta en este servicio.
                 </div>
              )}
            </div>
          </div>

          {/* EPICRISIS PREVIEW MODAL */}
          {selectedPatient && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
                <button 
                  onClick={() => setSelectedPatient(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>

                <div className="mb-6">
                   <h3 className="text-2xl font-bold text-slate-800">Gestión de Alta y Entrega de Cama</h3>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono text-slate-600">{selectedPatient.bedNumber}</span>
                      <span className="text-sm text-slate-500">{selectedPatient.name}</span>
                   </div>
                </div>

                {generatingDoc ? (
                  <div className="py-20 text-center space-y-6">
                    <div className="relative">
                       <div className="animate-spin w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full mx-auto"></div>
                       <div className="absolute inset-0 flex items-center justify-center">
                         <BrainCircuit size={24} className="text-indigo-300 animate-pulse" />
                       </div>
                    </div>
                    <div>
                      <p className="text-indigo-600 font-bold text-lg">Analizando Historial Clínico...</p>
                      <p className="text-slate-500 text-sm mt-2">{processingMessage}</p>
                    </div>
                  </div>
                ) : epicrisisResult && cleaningAnalysis ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Document Preview */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Epicrisis Generada (Vista Previa)</label>
                      <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 h-[300px] overflow-y-auto text-sm font-serif leading-relaxed shadow-inner prose prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: epicrisisResult.htmlContent }} />
                      </div>
                    </div>

                    {/* Cleaning Protocol Confirmation */}
                    <div className="flex flex-col gap-4">
                      
                      {/* AI Analysis of Cleaning */}
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                         <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <SprayCan size={16} />
                            Análisis de Aseo Post-Alta (IA)
                         </h4>
                         <div className="space-y-2">
                           <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Estado Infeccioso Detectado:</span>
                              {cleaningAnalysis.protocol === 'TERMINAL' ? (
                                 <span className="font-bold text-red-600">RIESGO DETECTADO</span>
                              ) : (
                                 <span className="font-bold text-green-600">BAJO RIESGO</span>
                              )}
                           </div>
                           <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Protocolo Recomendado:</span>
                              {cleaningAnalysis.protocol === 'TERMINAL' ? (
                                 <span className="font-bold text-red-600 border-b border-red-300">Aseo Terminal (60 min)</span>
                              ) : (
                                 <span className="font-bold text-green-600 border-b border-green-300">Aseo Rápido (20 min)</span>
                              )}
                           </div>
                         </div>

                         <div className="mt-3 bg-white/50 p-3 rounded-lg text-xs text-blue-800 leading-snug border border-blue-100">
                            <span className="font-bold block mb-1">Razonamiento IA:</span>
                            {cleaningAnalysis.reasoning}
                         </div>
                         
                         {cleaningAnalysis.protocol === 'RAPIDO' && (
                           <div className="mt-2 p-2 rounded bg-green-100 text-green-700 text-xs font-medium flex items-center gap-2">
                              <Clock size={14} className="shrink-0" />
                              <span>Optimización: Ahorro de 40 min validado.</span>
                           </div>
                         )}
                      </div>

                      <div className="mt-auto space-y-4">
                        <button 
                          onClick={handleDigitalDischarge}
                          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 transform active:scale-[0.98] transition-all"
                        >
                          <div className="text-left">
                             <div className="flex items-center gap-2">
                                <ClipboardCheck size={20} />
                                <span>Validar Alta y Solicitar Aseo</span>
                             </div>
                             <span className="text-[10px] font-normal opacity-80 block mt-0.5">La cama pasará a cola de limpieza inmediatamente</span>
                          </div>
                          <ArrowRight size={24} className="opacity-50" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AgenticCoordinator;