import React, { useState } from 'react';
import { ServiceData } from '../types';
import { Save, RefreshCw, AlertCircle, Activity, Lock, ArrowRightLeft, Bed } from 'lucide-react';

interface DataEntryFormProps {
  services: ServiceData[];
  onUpdate: (updatedServices: ServiceData[]) => void;
}

const DataEntryForm: React.FC<DataEntryFormProps> = ({ services, onUpdate }) => {
  const [localData, setLocalData] = useState<ServiceData[]>(services);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (id: string, field: keyof ServiceData, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value);
    setLocalData(prev => prev.map(s => s.id === id ? { ...s, [field]: isNaN(numValue) ? 0 : numValue } : s));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      onUpdate(localData);
      setIsSaving(false);
    }, 800);
  };

  // Calculations
  const getAvailable = (s: ServiceData) => s.totalBeds - s.occupiedBeds - s.blockedBeds;
  const getNetBalance = (s: ServiceData) => (getAvailable(s) + s.probableDischarges) - s.pendingAdmission;
  const getOccupancyRate = (s: ServiceData) => Math.round(((s.occupiedBeds + s.blockedBeds) / s.totalBeds) * 100);

  const TouchInput = ({ value, onChange, colorClass, icon: Icon }: { value: number, onChange: (val: string) => void, colorClass: string, icon?: any }) => (
    <div className="relative">
      {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />}
      <input 
        type="text" 
        inputMode="numeric" 
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-11 text-center text-lg font-semibold border rounded-lg focus:ring-2 focus:ring-offset-1 outline-none transition-all ${Icon ? 'pl-6' : ''} ${colorClass}`}
      />
    </div>
  );

  return (
    <div className="space-y-6 pb-24">
      {/* Header Info */}
      <div className="bg-white border border-indigo-100 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Activity size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Censo y Flujo de Camas</h3>
            <p className="text-sm text-slate-500">Actualice la ocupación real. El sistema recalculará el riesgo.</p>
          </div>
        </div>
        <div className="flex gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div> Ocupada</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-100 border border-slate-300 rounded"></div> Bloqueada</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div> Disponible</div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden xl:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-800 w-48">Servicio</th>
                <th className="px-4 py-4 text-center">Cap. Total</th>
                <th className="px-4 py-4 text-center w-32 text-red-700 bg-red-50/50 border-x border-red-50">Ocupadas</th>
                <th className="px-4 py-4 text-center w-32 text-slate-700 bg-slate-50/50 border-r border-slate-100">Bloqueadas</th>
                <th className="px-4 py-4 text-center bg-blue-50/30 font-bold text-blue-700">Disp. Real</th>
                <th className="px-4 py-4 text-center w-32 text-green-700">Altas Prob.</th>
                <th className="px-4 py-4 text-center w-32 text-orange-700">En Espera</th>
                <th className="px-4 py-4 text-center font-bold">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {localData.map((service) => {
                const available = getAvailable(service);
                const balance = getNetBalance(service);
                const occupancy = getOccupancyRate(service);
                
                return (
                  <tr key={service.id} className="bg-white hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 relative overflow-hidden">
                        {/* Occupancy Bar Background */}
                        <div className={`absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-500 opacity-20 group-hover:opacity-40`} style={{ width: `${occupancy}%` }}></div>
                        <span className="font-bold text-slate-900 text-base relative z-10">{service.name}</span>
                        {occupancy > 100 && <AlertCircle size={14} className="inline ml-2 text-red-500 relative z-10" />}
                    </td>
                    <td className="px-4 py-4 text-center font-mono text-slate-500 text-lg">{service.totalBeds}</td>
                    
                    {/* Inputs */}
                    <td className="px-4 py-4 bg-red-50/30 border-x border-red-50">
                      <TouchInput 
                        value={service.occupiedBeds} 
                        onChange={(v) => handleChange(service.id, 'occupiedBeds', v)} 
                        colorClass="border-red-200 focus:border-red-500 text-red-700 bg-white"
                      />
                    </td>
                    <td className="px-4 py-4 bg-slate-50/30 border-r border-slate-100">
                      <TouchInput 
                        value={service.blockedBeds} 
                        onChange={(v) => handleChange(service.id, 'blockedBeds', v)} 
                        colorClass="border-slate-300 focus:border-slate-500 text-slate-700 bg-white"
                        icon={Lock}
                      />
                    </td>

                    {/* Calculated Availability */}
                    <td className="px-4 py-4 text-center">
                        <span className={`text-xl font-bold font-mono ${available < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                            {available}
                        </span>
                    </td>

                    <td className="px-4 py-4">
                      <TouchInput 
                        value={service.probableDischarges} 
                        onChange={(v) => handleChange(service.id, 'probableDischarges', v)} 
                        colorClass="border-green-200 focus:border-green-500 text-green-700 bg-white"
                      />
                    </td>
                    <td className="px-4 py-4">
                       <TouchInput 
                        value={service.pendingAdmission} 
                        onChange={(v) => handleChange(service.id, 'pendingAdmission', v)} 
                        colorClass="border-orange-200 focus:border-orange-500 text-orange-700 bg-white"
                      />
                    </td>

                    {/* Net Balance Metric */}
                    <td className="px-4 py-4 text-center">
                        <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold border ${
                            balance >= 0 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'bg-red-100 text-red-700 border-red-200'
                        }`}>
                            {balance > 0 ? '+' : ''}{balance}
                        </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
        {localData.map((service) => {
            const available = getAvailable(service);
            const balance = getNetBalance(service);
            const occupancy = getOccupancyRate(service);

            return (
              <div key={service.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                
                {/* Occupancy Indicator Strip */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${occupancy > 95 ? 'bg-red-500' : occupancy > 85 ? 'bg-amber-400' : 'bg-green-400'}`}></div>

                <div className="flex justify-between items-start mb-4 mt-1">
                  <div>
                      <h3 className="font-bold text-xl text-slate-800">{service.name}</h3>
                      <p className="text-xs text-slate-400 font-medium">Capacidad Total: {service.totalBeds}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-sm font-bold border ${balance >= 0 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                     Balance: {balance > 0 ? '+' : ''}{balance}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                   {/* Row 1: Negative Factors (Occupied/Blocked) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-red-600 uppercase flex items-center gap-1">
                        <Bed size={12} /> Ocupadas
                    </label>
                    <TouchInput 
                      value={service.occupiedBeds} 
                      onChange={(v) => handleChange(service.id, 'occupiedBeds', v)} 
                      colorClass="border-red-200 bg-red-50 text-red-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Lock size={12} /> Bloqueadas
                    </label>
                    <TouchInput 
                      value={service.blockedBeds} 
                      onChange={(v) => handleChange(service.id, 'blockedBeds', v)} 
                      colorClass="border-slate-200 bg-slate-50 text-slate-700"
                    />
                  </div>

                   {/* Row 2: Flow Factors (Discharges/Pending) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-1">
                        <ArrowRightLeft size={12} /> Altas Prob.
                    </label>
                    <TouchInput 
                      value={service.probableDischarges} 
                      onChange={(v) => handleChange(service.id, 'probableDischarges', v)} 
                      colorClass="border-green-200 bg-green-50 text-green-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-orange-600 uppercase flex items-center gap-1">
                        <Activity size={12} /> En Espera
                    </label>
                    <TouchInput 
                      value={service.pendingAdmission} 
                      onChange={(v) => handleChange(service.id, 'pendingAdmission', v)} 
                      colorClass="border-orange-200 bg-orange-50 text-orange-800"
                    />
                  </div>
                </div>
                
                {/* Calculated Availability Footer */}
                <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-100">
                    <span className="text-xs text-blue-600 font-medium uppercase">Disponibilidad Real</span>
                    <div className="text-xl font-bold text-blue-800 leading-none mt-1">{available} camas</div>
                </div>

              </div>
            );
        })}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-slate-200 md:relative md:bg-transparent md:border-0 md:p-0 z-30 flex justify-end">
         <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-lg font-bold py-4 px-10 rounded-2xl shadow-xl shadow-indigo-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3"
        >
          {isSaving ? (
            <>
              <RefreshCw className="animate-spin" size={24} /> Guardando...
            </>
          ) : (
            <>
              <Save size={24} /> Confirmar Cambios
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DataEntryForm;