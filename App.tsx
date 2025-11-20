import React, { useState } from 'react';
import { LayoutDashboard, BedDouble, Activity, Menu, X, BrainCircuit } from 'lucide-react';
import { initialServiceData, getTotalStats } from './services/hospitalData';
import { ServiceData } from './types';
import DataEntryForm from './components/DataEntryForm';
import BedAgent from './components/BedAgent';
import AgenticCoordinator from './components/AgenticCoordinator';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [services, setServices] = useState<ServiceData[]>(initialServiceData);
  const stats = getTotalStats(services);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'input' | 'agent' | 'coordinator'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard services={services} setActiveTab={setActiveTab} />;
      case 'input':
        return <DataEntryForm services={services} onUpdate={setServices} />;
      case 'agent':
        return <BedAgent services={services} />;
      case 'coordinator':
        return <AgenticCoordinator />;
      default:
        return null;
    }
  };

  const SidebarItem = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
    <button 
      onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
      className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 mb-2
        ${activeTab === id 
          ? 'bg-blue-600 text-white shadow-md transform scale-[1.02]' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
      <Icon size={24} strokeWidth={activeTab === id ? 2.5 : 2} />
      <span className="font-medium text-lg">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col h-full
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
               BedAI <span className="text-blue-400">Norte</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Hospital San José</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 p-2">
            <X size={28} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="mb-8">
            <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-2">Menu Principal</p>
            <SidebarItem id="dashboard" label="Panel de Control" icon={LayoutDashboard} />
            <SidebarItem id="input" label="Gestión de Censo" icon={BedDouble} />
          </div>

          <div className="mb-8">
            <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-2">Inteligencia Artificial</p>
            <SidebarItem id="agent" label="Orquestador Global" icon={Activity} />
            <SidebarItem id="coordinator" label="Agente Clínico" icon={BrainCircuit} />
          </div>
        </nav>

        <div className="p-6 border-t border-slate-800">
           <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Estado del Sistema</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-sm font-medium text-slate-200">Online</span>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen w-full relative">
        {/* Mobile Header */}
        <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between lg:hidden sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-700 active:scale-95 transition-transform"
              onClick={() => setIsSidebarOpen(true)}
            >
               <Menu size={28} />
            </button>
            <span className="font-bold text-slate-800 text-lg">
              {activeTab === 'dashboard' && 'Resumen'}
              {activeTab === 'input' && 'Censo'}
              {activeTab === 'agent' && 'Orquestador'}
              {activeTab === 'coordinator' && 'Agente Clínico'}
            </span>
          </div>
          <div className={`w-3 h-3 rounded-full ${stats.occupancyRate >= 95 ? 'bg-red-500' : 'bg-green-500'}`}></div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex p-8 pb-0 justify-between items-end mb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">
              {activeTab === 'dashboard' && 'Centro de Comando'}
              {activeTab === 'input' && 'Actualización de Censo'}
              {activeTab === 'agent' && 'Orquestador Inteligente'}
              {activeTab === 'coordinator' && 'Coordinación Clínica Agéntica'}
            </h2>
            <p className="text-slate-500 mt-1">
              {activeTab === 'dashboard' && 'Supervisión en tiempo real y gestión de eventualidades.'}
              {activeTab === 'coordinator' 
                ? 'Gestión de GRD, Epicrisis Digital y Flujo de Urgencia.' 
                : activeTab === 'input' ? 'Ingreso manual de datos por servicio.' : 'Análisis predictivo avanzado.'}
            </p>
          </div>
          <div className="text-right">
             <p className="text-sm text-slate-400 font-mono">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 pt-4 scroll-smooth">
           <div className="max-w-7xl mx-auto">
             {renderContent()}
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;
