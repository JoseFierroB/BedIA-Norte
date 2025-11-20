import React from 'react';
import { Activity, BedDouble, BrainCircuit, TrendingUp, AlertCircle } from 'lucide-react';
import MetricCard from './MetricCard';
import LiveForum from './LiveForum';
import EventLog from './EventLog';
import { ServiceData, ServiceType } from '../types';
import { getTotalStats } from '../services/hospitalData';

interface DashboardProps {
  services: ServiceData[];
  setActiveTab: (tab: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ services, setActiveTab }) => {
  const stats = getTotalStats(services);

  const getGlobalStatusColor = () => {
    if (stats.occupancyRate >= 95) return 'red';
    if (stats.occupancyRate >= 85) return 'yellow';
    return 'green';
  };

  return (
    <div className="space-y-6 pb-20">
      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Ocupación Total" 
          value={`${stats.occupancyRate}%`} 
          icon={Activity} 
          color={getGlobalStatusColor()}
          trend={`${stats.occupied}/${stats.totalBeds} camas activas`}
        />
        <MetricCard 
          title="Espera Cama" 
          value={stats.pending} 
          icon={BedDouble} 
          color="red" 
          trend="Pacientes en Urgencia"
        />
        <MetricCard 
          title="Altas Probables" 
          value={stats.discharges} 
          icon={TrendingUp} 
          color="green" 
          trend="Próximas 24h"
        />
        <MetricCard 
          title="Camas Bloqueadas" 
          value={services.reduce((acc, s) => acc + s.blockedBeds, 0)} 
          icon={AlertCircle} 
          color="slate" 
          trend="Mantenimiento / Aislamiento"
        />
      </div>

      {/* MAIN CONTROL GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: OPERATIONAL STATUS (8 Cols) */}
        <div className="xl:col-span-8 space-y-6">
            
            {/* Main Occupancy Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 text-lg">Estado de Servicios Clínicos</h3>
                    <button 
                        onClick={() => setActiveTab('input')}
                        className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        Actualizar Censo
                    </button>
                </div>
                <div className="space-y-8">
                    {services.map(s => (
                        <div key={s.id} className="relative">
                            <div className="flex justify-between text-sm mb-2 items-end">
                                <div>
                                    <span className="font-bold text-slate-700 text-base block">{s.name}</span>
                                    {/* Summary lines */}
                                    <div className="flex flex-col mt-1">
                                        {s.probableDischarges > 0 && (
                                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                                <TrendingUp size={12} />
                                                {s.probableDischarges} camas disponibles para alta inmediata
                                            </span>
                                        )}
                                        {s.pendingAdmission > 0 && (
                                            <span className="text-xs font-bold text-red-500 mt-0.5">
                                                {s.pendingAdmission} pacientes en espera
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className="text-slate-600 font-mono font-medium">{s.occupiedBeds}/{s.totalBeds} ({Math.round(s.occupiedBeds/s.totalBeds*100)}%)</span>
                            </div>
                            {/* Background Bar */}
                            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden relative">
                                {/* Fill Bar */}
                                <div 
                                    className={`h-4 rounded-full transition-all duration-1000 ${
                                        (s.occupiedBeds / s.totalBeds) >= 1 ? 'bg-red-500' : 
                                        (s.occupiedBeds / s.totalBeds) >= 0.85 ? 'bg-amber-500' : 'bg-blue-600'
                                    }`} 
                                    style={{ width: `${Math.min((s.occupiedBeds/s.totalBeds)*100, 100)}%` }}
                                >
                                    {/* Striped Pattern for 'Visual Texture' */}
                                    <div className="w-full h-full opacity-20 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')]"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions / AI Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100 flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-indigo-900 mb-2">Orquestador AI</h3>
                        <p className="text-indigo-800 text-sm leading-relaxed mb-4">
                            El análisis predictivo detecta posibles cuellos de botella en <strong>Urgencia</strong> para las próximas 4 horas.
                        </p>
                    </div>
                    <button 
                        onClick={() => setActiveTab('agent')}
                        className="w-full py-3 bg-white text-indigo-700 font-bold rounded-xl shadow-sm border border-indigo-200 hover:bg-indigo-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <BrainCircuit size={18} />
                        Ver Estrategia Completa
                    </button>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-center items-center text-center">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tiempo Promedio de Aseo</p>
                     <p className="text-3xl font-bold text-slate-700">42 min</p>
                     <span className="text-green-600 text-xs font-bold bg-green-100 px-2 py-0.5 rounded-full mt-2">▼ 5% vs Ayer</span>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: COMMUNICATION & LOGS (4 Cols) */}
        <div className="xl:col-span-4 space-y-6">
            <LiveForum />
            <EventLog />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;