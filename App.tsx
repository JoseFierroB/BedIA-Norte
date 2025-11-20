import React, { useState } from 'react';
import { LayoutDashboard, BedDouble, Activity, Menu } from 'lucide-react';
import { initialServiceData, getTotalStats } from './services/hospitalData';
import { ServiceData } from './types';
import MetricCard from './components/MetricCard';
import DataEntryForm from './components/DataEntryForm';
import BedAgent from './components/BedAgent';

const App: React.FC = () => {
  const [services, setServices] = useState<ServiceData[]>(initialServiceData);
  const stats = getTotalStats(services);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'input' | 'agent'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Determine global status color
  const getGlobalStatusColor = () => {
    if (stats.occupancyRate >= 95) return 'red';
    if (stats.occupancyRate >= 85) return 'yellow';
    return 'green';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard 
                title="Ocupación Total" 
                value={`${stats.occupancyRate}%`} 
                icon={Activity} 
                color={getGlobalStatusColor()}
                trend={`${stats.occupied}/${stats.totalBeds} camas`}
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
                icon={Activity} 
                color="green" 
                trend="Próximas 24h"
              />
              <MetricCard 
                title="Camas Bloqueadas" 
                value={services.reduce((acc, s) => acc + s.blockedBeds, 0)} 
                icon={BedDouble} 
                color="slate" 
                trend="Mantenimiento"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="font-bold text-slate-800 mb-4">Ocupación por Servicio</h3>
                 <div className="space-y-4">
                   {services.map(s => (
                     <div key={s.id}>
                       <div className="flex justify-between text-sm mb-1">
                         <span className="font-medium text-slate-700">{s.name}</span>
                         <span className="text-slate-500">{s.occupiedBeds}/{s.totalBeds} ({Math.round(s.occupiedBeds/s.totalBeds*100)}%)</span>
                       </div>
                       <div className="w-full bg-slate-100 rounded-full h-2.5">
                         <div 
                           className={`h-2.5 rounded-full ${s.occupiedBeds >= s.totalBeds ? 'bg-red-500' : 'bg-blue-600'}`} 
                           style={{ width: `${Math.min((s.occupiedBeds/s.totalBeds)*100, 100)}%` }}
                         ></div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
               
               <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                 <h3 className="font-bold text-blue-900 mb-2">Estado del Hospital</h3>
                 <p className="text-blue-800 text-sm mb-4">
                   La ocupación global es del {stats.occupancyRate}%. 
                   {stats.pending > 10 ? ' Se requiere agilizar altas en medicina.' : ' Flujo estable.'}
                 </p>
                 <button 
                   onClick={() => setActiveTab('agent')}
                   className="text-sm font-medium text-blue-700 hover:text-blue-900 underline"
                 >
                   Ver recomendaciones de IA &rarr;
                 </button>
               </div>
            </div>
          </div>
        );
      case 'input':
        return <DataEntryForm services={services} onUpdate={setServices} />;
      case 'agent':
        return <BedAgent services={services} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar / Mobile Header */}
      <div className="bg-slate-900 text-white w-full md:w-64 flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">BedAI <span className="text-blue-400">Norte</span></h1>
            <p className="text-xs text-slate-400 mt-1">Hospital San José</p>
          </div>
          <button 
            className="md:hidden p-2 rounded hover:bg-slate-800"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
             <Menu size={24} />
          </button>
        </div>
        
        <nav className={`flex-1 p-4 space-y-2 ${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}>
          <button 
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Panel de Control</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('input'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'input' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <BedDouble size={20} />
            <span className="font-medium">Gestión de Censo</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('agent'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'agent' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Activity size={20} />
            <span className="font-medium">Agente Inteligente</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 hidden md:block">
          v0.1.0 MVP
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto h-screen">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'dashboard' && 'Resumen General'}
              {activeTab === 'input' && 'Ingreso de Datos'}
              {activeTab === 'agent' && 'Asistente Predictivo'}
            </h2>
            <p className="text-slate-500 text-sm">
              Última actualización: {new Date().toLocaleTimeString()}
            </p>
          </div>
          
          <div className={`px-4 py-1.5 rounded-full border text-sm font-medium flex items-center gap-2
            ${stats.occupancyRate >= 95 ? 'bg-red-50 border-red-200 text-red-700' : 
              stats.occupancyRate >= 85 ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 
              'bg-green-50 border-green-200 text-green-700'}`}
          >
            <div className={`w-2 h-2 rounded-full ${stats.occupancyRate >= 95 ? 'bg-red-500' : stats.occupancyRate >= 85 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            {stats.occupancyRate >= 95 ? 'Saturación Crítica' : stats.occupancyRate >= 85 ? 'Saturación Alta' : 'Flujo Normal'}
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
};

export default App;