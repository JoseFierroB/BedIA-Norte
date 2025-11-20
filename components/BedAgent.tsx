import React, { useEffect, useState } from 'react';
import { ServiceData, AIAnalysis, RiskLevel } from '../types';
import { analyzeHospitalState, generateOfficialReport, chatWithBedAgent } from '../services/geminiService';
import { Bot, Sparkles, FileText, AlertTriangle, CheckCircle, ArrowRight, MessageSquare } from 'lucide-react';

interface BedAgentProps {
  services: ServiceData[];
}

const BedAgent: React.FC<BedAgentProps> = ({ services }) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  // Auto-analyze when services change
  useEffect(() => {
    const runAnalysis = async () => {
      setLoading(true);
      try {
        const result = await analyzeHospitalState(services);
        setAnalysis(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    runAnalysis();
    // Reset report when data changes
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
      // Simplified history for MVP
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
      case RiskLevel.HIGH: return 'bg-red-100 text-red-800 border-red-200';
      case RiskLevel.MEDIUM: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case RiskLevel.LOW: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Analysis Card */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Bot size={120} />
          </div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">BedAI Assistant</h2>
              <p className="text-sm text-slate-500">Análisis predictivo en tiempo real</p>
            </div>
          </div>

          {loading && !analysis ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-32 bg-slate-200 rounded"></div>
            </div>
          ) : analysis ? (
            <div className="space-y-6 relative z-10">
              
              <div className={`p-4 rounded-lg border flex items-start gap-3 ${getRiskColor(analysis.riskAssessment?.level)}`}>
                <AlertTriangle className="shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold">Nivel de Riesgo: {analysis.riskAssessment?.level}</h4>
                  <p className="text-sm mt-1 opacity-90">{analysis.riskAssessment?.reasoning}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-500 mb-1">Predicción de Altas (24h)</p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {analysis.predictedDischarges24h}
                    <span className="text-sm text-slate-400 font-normal ml-2">pacientes</span>
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-500 mb-1">Resumen Operativo</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{analysis.summary}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  Recomendaciones Sugeridas
                </h4>
                <ul className="space-y-2">
                  {analysis.recommendations?.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 bg-white p-3 rounded border border-slate-100 shadow-sm">
                      <ArrowRight size={14} className="mt-1 text-indigo-400 shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
             <p className="text-slate-500">Esperando datos...</p>
          )}
        </div>

        {/* Chat Interface */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
             <MessageSquare size={18} className="text-indigo-500"/> Consulta al Agente
           </h3>
           
           {chatResponse && (
             <div className="mb-4 p-3 bg-indigo-50 text-indigo-900 rounded-lg text-sm border border-indigo-100">
               <span className="font-bold block mb-1">BedAI:</span>
               {chatResponse}
             </div>
           )}

           <form onSubmit={handleChat} className="flex gap-2">
             <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ej: ¿Qué servicio tiene mayor saturación ahora?"
                className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
             />
             <button 
               type="submit" 
               disabled={chatLoading}
               className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
             >
               {chatLoading ? '...' : 'Enviar'}
             </button>
           </form>
        </div>
      </div>

      {/* Reporting Side Panel */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-full flex flex-col">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
             <h3 className="font-bold text-slate-800">Reporte Oficial</h3>
             <FileText size={20} className="text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 mb-4">Genera el informe diario para SSMN automáticamente.</p>
          <button 
            onClick={handleGenerateReport}
            disabled={loading}
            className="w-full py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
          >
            {loading && !reportText ? 'Generando...' : 'Redactar Reporte'}
          </button>
        </div>

        {reportText && (
          <div className="flex-1 bg-white p-4 rounded border border-slate-200 overflow-y-auto text-sm text-slate-700 font-mono whitespace-pre-wrap shadow-inner h-64 lg:h-auto">
            {reportText}
          </div>
        )}
      </div>
    </div>
  );
};

export default BedAgent;