import React, { useState } from 'react';
import { AlertTriangle, Info, CheckCircle, Plus, Clock, Siren } from 'lucide-react';

interface HospitalEvent {
  id: string;
  type: 'CRITICO' | 'ADVERTENCIA' | 'INFO';
  title: string;
  description: string;
  time: Date;
}

const INITIAL_EVENTS: HospitalEvent[] = [
  { id: '1', type: 'CRITICO', title: 'Falla en Scanner', description: 'Scanner 2 fuera de servicio. Derivar urgencias neurológicas.', time: new Date(Date.now() - 1000 * 60 * 120) },
  { id: '2', type: 'ADVERTENCIA', title: 'Ausentismo UPC', description: 'Falta 1 TENS en turno noche UPC.', time: new Date(Date.now() - 1000 * 60 * 45) },
];

const EventLog: React.FC = () => {
  const [events, setEvents] = useState<HospitalEvent[]>(INITIAL_EVENTS);
  const [showForm, setShowForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<'CRITICO' | 'ADVERTENCIA' | 'INFO'>('INFO');

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newEventTitle) return;

    const newEvent: HospitalEvent = {
        id: Date.now().toString(),
        type: newEventType,
        title: newEventTitle,
        description: 'Registrado manualmente por J. Turno',
        time: new Date()
    };

    setEvents([newEvent, ...events]);
    setNewEventTitle('');
    setShowForm(false);
  };

  const getTypeStyles = (type: string) => {
      switch(type) {
          case 'CRITICO': return 'bg-red-50 border-red-100 text-red-800';
          case 'ADVERTENCIA': return 'bg-amber-50 border-amber-100 text-amber-800';
          default: return 'bg-blue-50 border-blue-100 text-blue-800';
      }
  };

  const getTypeIcon = (type: string) => {
      switch(type) {
          case 'CRITICO': return <Siren size={16} className="text-red-600" />;
          case 'ADVERTENCIA': return <AlertTriangle size={16} className="text-amber-600" />;
          default: return <Info size={16} className="text-blue-600" />;
      }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
       <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500 p-1.5 rounded-lg text-white">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Bitácora de Eventualidades</h3>
            <p className="text-xs text-slate-500">Registro Oficial de Incidencias</p>
          </div>
        </div>
        <button 
            onClick={() => setShowForm(!showForm)}
            className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        
        {showForm && (
            <form onSubmit={handleAddEvent} className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 animate-in slide-in-from-top-2">
                <input 
                    className="w-full mb-2 p-2 text-sm border rounded-lg" 
                    placeholder="Título del evento..." 
                    value={newEventTitle}
                    onChange={e => setNewEventTitle(e.target.value)}
                    autoFocus
                />
                <div className="flex justify-between items-center">
                    <select 
                        className="text-xs p-1.5 rounded border bg-white"
                        value={newEventType}
                        onChange={(e) => setNewEventType(e.target.value as any)}
                    >
                        <option value="INFO">Informativo</option>
                        <option value="ADVERTENCIA">Advertencia</option>
                        <option value="CRITICO">Crítico</option>
                    </select>
                    <button type="submit" className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg font-bold">Registrar</button>
                </div>
            </form>
        )}

        <div className="space-y-3 relative">
            {/* Timeline Line */}
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-100"></div>

            {events.map((evt) => (
                <div key={evt.id} className="relative pl-8">
                    {/* Timeline Dot */}
                    <div className="absolute left-0 top-1 bg-white border-2 border-slate-200 w-6 h-6 rounded-full flex items-center justify-center z-10">
                        {getTypeIcon(evt.type)}
                    </div>
                    
                    <div className={`p-3 rounded-xl border ${getTypeStyles(evt.type)} shadow-sm`}>
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-sm">{evt.title}</h4>
                            <span className="text-[10px] font-mono opacity-70 flex items-center gap-1">
                                <Clock size={10} />
                                {evt.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                        <p className="text-xs opacity-90 leading-relaxed">{evt.description}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default EventLog;
