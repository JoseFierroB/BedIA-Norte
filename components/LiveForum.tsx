import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Shield, Stethoscope, MoreVertical, MessageSquare, Radio, Bot, Zap } from 'lucide-react';
import { analyzeChatMessage } from '../services/geminiService';

interface Message {
  id: string;
  user: string;
  role: 'Jefe de Turno' | 'Enfermera' | 'Médico' | 'Admin' | 'System';
  text: string;
  timestamp: Date;
  isAlert?: boolean; // Visual highlight for AI alerts
}

const INITIAL_MESSAGES: Message[] = [
  { id: '1', user: 'Dr. Silva', role: 'Jefe de Turno', text: 'Equipo, priorizar altas de Medicina. Urgencia está colapsada con 15 pacientes en espera.', timestamp: new Date(Date.now() - 1000 * 60 * 60) },
  { id: '2', user: 'E.U. Claudia', role: 'Enfermera', text: 'Cama 402 y 405 listas para aseo. Avisando a personal.', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
  { id: '3', user: 'Dr. Silva', role: 'Jefe de Turno', text: 'Recibido. Envíen pacientes de tránsito en cuanto estén habilitadas.', timestamp: new Date(Date.now() - 1000 * 60 * 28) },
];

const LiveForum: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAnalyzing]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsgText = input;
    const userRole = 'Admin'; // Simulated current user role

    // 1. Add User Message immediately
    const newMessage: Message = {
      id: Date.now().toString(),
      user: 'Usuario Actual',
      role: userRole, 
      text: userMsgText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsAnalyzing(true);

    // 2. AI Semantic Analysis
    try {
        const analysis = await analyzeChatMessage(userMsgText, userRole);
        
        if (analysis.shouldNotify) {
            // Artificial delay for effect
            await new Promise(r => setTimeout(r, 600));

            const alertMessage: Message = {
                id: (Date.now() + 1).toString(),
                user: 'BedAI System',
                role: 'System',
                text: `📢 AVISO AUTOMATIZADO: Notificación enviada a ${analysis.targetGroup}. Prioridad: ${analysis.priority}. (${analysis.reason})`,
                timestamp: new Date(),
                isAlert: true
            };
            setMessages(prev => [...prev, alertMessage]);
        }
    } catch (error) {
        console.error("Error in chat analysis", error);
    } finally {
        setIsAnalyzing(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Jefe de Turno': return <Shield size={14} />;
      case 'Médico': return <Stethoscope size={14} />;
      case 'System': return <Bot size={14} />;
      default: return <User size={14} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Jefe de Turno': return 'bg-indigo-100 text-indigo-700';
      case 'Médico': return 'bg-blue-100 text-blue-700';
      case 'Enfermera': return 'bg-teal-100 text-teal-700';
      case 'System': return 'bg-slate-800 text-white';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
            <MessageSquare size={18} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Chat de Coordinación</h3>
            <p className="text-xs text-slate-500">Canal en vivo con IA Semántica</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            {isAnalyzing && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full animate-pulse">
                    <Zap size={10} /> Analizando...
                </span>
            )}
            <button className="text-slate-400 hover:text-slate-600">
            <MoreVertical size={18} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'Admin' ? 'items-end' : msg.role === 'System' ? 'items-center' : 'items-start'}`}>
            
            {msg.role !== 'System' && (
                <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${getRoleColor(msg.role)}`}>
                    {getRoleIcon(msg.role)} {msg.role}
                </span>
                <span className="text-[10px] text-slate-400">{msg.user} • {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            )}

            <div className={`px-4 py-2.5 text-sm shadow-sm max-w-[85%]
              ${msg.role === 'Admin' ? 'bg-indigo-600 text-white rounded-2xl rounded-br-none' : 
                msg.role === 'System' ? 'bg-slate-800 text-slate-200 text-xs font-mono border border-slate-700 rounded-xl w-full text-center py-3 my-2' :
                'bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-bl-none'
              }
            `}>
              {msg.role === 'System' && <Radio className="inline mr-2 text-green-400 animate-pulse" size={12} />}
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-slate-200 flex gap-2 bg-white rounded-b-2xl">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escriba un mensaje o @alerta..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button 
          type="submit"
          disabled={isAnalyzing}
          className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default LiveForum;