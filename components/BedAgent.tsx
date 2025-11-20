import React, { useEffect, useState } from 'react';
import { ServiceData, AIAnalysis, RiskLevel } from '../types';
import { analyzeHospitalState, generateOfficialReport, chatWithBedAgent } from '../services/geminiService';
import { Bot, Sparkles, FileText, AlertTriangle, CheckCircle, ArrowRight, MessageSquare, Network, Database, Cpu, Send } from 'lucide-react';

interface BedAgentProps {
  services: ServiceData[];
}

const BedAgent: React.FC<BedAgentProps> = ({ services }) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('IDLE');
  const [reportText, setReportText] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  // Auto-analyze when services change
  useEffect(() => {
    const runAnalysis = async () => {
      setLoading(true);
      setLoadingStep('INIT');
      try {
        const result = await analyzeHospitalState(services, (step) => setLoadingStep(step));
        setAnalysis(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setLoadingStep('IDLE');
      }
    };
    runAnalysis();
    setReportText(null); 
    setChatResponse(null);
  }, [services]);

  const handleGenerateReport = async () => {
    setLoading(true);
    const text = await generateOfficialReport(services);
    setReportText(text);
    setLoading(false);
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!chatInput.trim()) return;
    
    setChatLoading(true);
    try {
      const response = await chatWithBedAgent([], services, chatInput);
      setChatResponse(response);
    } catch (e) {
      setChatResponse("Error de conexión con BedAI.");
    } finally {
      setChatLoading(false);
      setChatInput('');
    }
  };

  const getRiskColor = (level?: RiskLevel) => {
    switch(level) {
      case RiskLevel.HIGH: return 'bg-red-50 text-red-800 border-red-200';
      case RiskLevel.MEDIUM: return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case RiskLevel.LOW: return 'bg-green-50 text-green-800 border-green-200';
      default: return 'bg-slate-50 text-slate-800';
    }
  };

  const isStepActive = (current: string, target: string) => {
    const steps = ['INIT', 'ML_ENGINE', 'RAG_RETRIEVAL', 'LLM_GENERATION', 'DONE'];
    const currentIndex = steps.indexOf(current);
    const targetIndex = steps.indexOf(target);
    return currentIndex >= targetIndex;
  };

  const isStepProcessing = (current: string, target: string) => {
    return current === target;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-20">
      {/* Main Analysis Card */}
      <div className="xl:col-span-2 space-y-6">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-indigo-100 relative overflow-hidden">
          {/* Decorative BG */}
          <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] rotate-12 pointer-events-none">
            <Bot size={200} />
          </div>
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 relative z-10 gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm">
                <Sparkles size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">BedAI Orquestador</h2>
                <p className="text-sm text-slate-500">Arquitectura Híbrida (ML + RAG + LLM)</p>
              </div>
            </div>
            
            {analysis && !loading && (
               <div className="flex flex-wrap gap-2">
                 {analysis.metadata.fallbackMode ? (
                    <span className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-bold border border-red-200 flex items-center gap-2">
                      <AlertTriangle size={14} /> Fallback Activo
                    </span>
                 ) : (
                    <span className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-bold border border-green-200 flex items-center gap-2">
                      <Network size={14} /> {analysis.metadata.llmUsed}
                    </span>
                 )}
               </div>
            )}
          </div>

          {/* Loading State - Pipeline Visualization */}
          {loading && !analysis ? (
             <div className="flex flex-col items-center justify-center py-12 space-y-6 relative z-10">
               <div className="w-full max-w-lg space-y-6">
                  {/* Step 1: ML */}
                  <div className={`flex items-center gap-5 p-4 rounded-xl border transition-all duration-500 ${isStepActive(loadingStep, 'ML_ENGINE') ? 'bg-white shadow-md border-blue-100 scale-105' : 'opacity-50 border-transparent'}`}>
                     <div className={`p-3 rounded-full border ${isStepProcessing(loadingStep, 'ML_ENGINE') ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        <Cpu size={24} className={isStepProcessing(loadingStep, 'ML_ENGINE') ? 'animate-spin' : ''} />
                     </div>
                     <div className="flex-1">
                        <h4 className="font-bold text-slate-700">Motor Heurístico (ML)</h4>
                        <p className="text-sm text-slate-500">Calculando riesgos y proyecciones matemáticas...</p>
                     </div>
                  </div>
                  
                  {/* Step 2: RAG */}
                   <div className={`flex items-center gap-5 p-4 rounded-xl border transition-all duration-500 ${isStepActive(loadingStep, 'RAG_RETRIEVAL') ? 'bg-white shadow-md border-purple-100 scale-105' : 'opacity-50 border-transparent'}`}>
                     <div className={`p-3 rounded-full border ${isStepProcessing(loadingStep, 'RAG_RETRIEVAL') ? 'bg-purple-100 text-purple-600 border-purple-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        <Database size={24} className={isStepProcessing(loadingStep, 'RAG_RETRIEVAL') ? 'animate-pulse' : ''} />
                     </div>
                     <div className="flex-1">
                        <h4 className="font-bold text-slate-700">Base de Conocimiento (RAG)</h4>
                        <p className="text-sm text-slate-500">Consultando protocolos institucionales...</p>
                     </div>
                  </div>

                  {/* Step 3: LLM */}
                   <div className={`flex items-center gap-5 p-4 rounded-xl border transition-all duration-500 ${isStepActive(loadingStep, 'LLM_GENERATION') ? 'bg-white shadow-md border-teal-100 scale-105' : 'opacity-50 border-transparent'}`}>
                     <div className={`p-3 rounded-full border ${isStepProcessing(loadingStep, 'LLM_GENERATION') ? 'bg-teal-100 text-teal-600 border-teal-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        <Bot size={24} className={isStepProcessing(loadingStep, 'LLM_GENERATION') ? 'animate-bounce' : ''} />
                     </div>
                     <div className="flex-1">
                        <h4 className="font-bold text-slate-700">Generación Cognitiva</h4>
                        <p className="text-sm text-slate-500">Sintetizando respuesta final...</p>
                     </div>
                  </div>
               </div>
            </div>
          ) : analysis ? (
            <div className="space-y-8 relative z-10 animate-in fade-in duration-500">
              
              {/* Metadata Chips */}
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                <div className={`shrink-0 flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border ${analysis.metadata.mlEngineUsed ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 text-gray-400'}`}>
                   <Cpu size={14} /> ML Engine
                </div>
                <div className={`shrink-0 flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border ${analysis.metadata.ragDocuments.length > 0 ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-gray-50 text-gray-400'}`}>
                   <Database size={14} /> RAG Retrieval
                </div>
                <div className={`shrink-0 flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border ${!analysis.metadata.fallbackMode ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-gray-50 text-gray-400'}`}>
                   <Bot size={14} /> Gemini 2.5 Flash
                </div>
              </div>

              {/* Main Result */}
              <div className={`p-6 rounded-xl border flex flex-col md:flex-row items-start gap-4 shadow-sm ${getRiskColor(analysis.riskAssessment?.level)}`}>
                <div className="p-3 bg-white/60 rounded-full backdrop-blur-sm">
                   <AlertTriangle className="w-8 h-8 opacity-90" />
                </div>
                <div>
                  <h4 className="text-xl font-bold uppercase tracking-tight">Nivel de Riesgo: {analysis.riskAssessment?.level}</h4>
                  <p className="text-base mt-2 opacity-90 leading-relaxed font-medium">{analysis.riskAssessment?.reasoning}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Predicción de Altas (24h)</p>
                  <p className="text-4xl font-bold text-indigo-600 flex items-baseline gap-2">
                    {analysis.predictedDischarges24h}
                    <span className="text-base text-slate-400 font-normal">pacientes</span>
                  </p>
                  {analysis.metadata.fallbackMode && <p className="text-xs text-orange-600 mt-2 font-medium bg-orange-50 inline-block px-2 py-1 rounded">* Estimación directa ML (Sin IA Gen)</p>}
                </div>
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Resumen Operativo</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{analysis.summary}</p>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-lg">
                  <CheckCircle size={20} className="text-green-600" />
                  Recomendaciones Estratégicas
                </h4>
                <div className="space-y-3">
                  {analysis.recommendations?.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-slate-700 bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                      <div className="mt-1 w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 text-sm font-bold">
                        {idx + 1}
                      </div>
                      <span className="mt-0.5">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* RAG Sources */}
              {analysis.metadata.ragDocuments.length > 0 && (
                <div className="mt-6 pt-6 border-t border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-bold mb-3 uppercase flex items-center gap-2">
                    <Database size={12} />
                    Protocolos Aplicados (Contexto RAG)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.metadata.ragDocuments.map((doc, i) => (
                      <span key={i} className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 font-medium">
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
             <p className="text-slate-500 italic text-center py-10">Esperando datos para análisis...</p>
          )}
        </div>

        {/* Chat Interface - Optimized for Touch */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
           <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
             <MessageSquare size={20} className="text-indigo-500"/> 
             Chat con Agente
           </h3>
           
           {chatResponse && (
             <div className="mb-6 p-4 bg-indigo-50 text-indigo-900 rounded-2xl text-base border border-indigo-100 shadow-sm">
               <span className="font-bold block mb-1 text-xs uppercase opacity-70">BedAI responde:</span>
               {chatResponse}
             </div>
           )}

           <form onSubmit={handleChat} className="flex gap-3">
             <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Pregunta sobre camas, servicios o riesgos..."
                className="flex-1 border border-slate-300 rounded-xl px-4 py-3 md:py-4 text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
             />
             <button 
               type="submit" 
               disabled={chatLoading}
               className="bg-indigo-600 text-white px-6 md:px-8 rounded-xl hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 flex items-center justify-center shadow-md shadow-indigo-200"
             >
               {chatLoading ? <Sparkles className="animate-spin" /> : <Send size={24} />}
             </button>
           </form>
        </div>
      </div>

      {/* Reporting Side Panel - Streamlit Style Sidebar Widget */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 h-full shadow-sm flex flex-col sticky top-4">
        <div className="mb-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                <FileText size={24} />
             </div>
             <h3 className="font-bold text-slate-800 text-lg">Reporte Oficial</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">Generación automática de informe diario para Dirección de Servicio de Salud (SSMN).</p>
          
          <button 
            onClick={handleGenerateReport}
            disabled={loading}
            className="w-full py-3 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-700 active:scale-[0.98] transition-all shadow-lg shadow-slate-200 flex justify-center items-center gap-2"
          >
            {loading && !reportText ? (
               <>Generando...</>
            ) : (
               <>Redactar Informe</>
            )}
          </button>
        </div>

        {reportText ? (
          <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-y-auto text-sm text-slate-700 font-mono whitespace-pre-wrap shadow-inner max-h-[500px]">
            {reportText}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic bg-slate-50 rounded-xl border border-dashed border-slate-200 h-32">
             El reporte aparecerá aquí
          </div>
        )}
      </div>
    </div>
  );
};

export default BedAgent;