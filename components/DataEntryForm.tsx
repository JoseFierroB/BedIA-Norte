import React, { useState } from 'react';
import { ServiceData } from '../types';
import { Save, RefreshCw, ChevronRight } from 'lucide-react';

interface DataEntryFormProps {
  services: ServiceData[];
  onUpdate: (updatedServices: ServiceData[]) => void;
}

const DataEntryForm: React.FC<DataEntryFormProps> = ({ services, onUpdate }) => {
  const [localData, setLocalData] = useState<ServiceData[]>(services);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (id: string, field: keyof ServiceData, value: string) => {
    // Handle empty string as 0 temporarily or keep simplified
    const numValue = value === '' ? 0 : parseInt(value);
    setLocalData(prev => prev.map(s => s.id === id ? { ...s, [field]: isNaN(numValue) ? 0 : numValue } : s));
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate network delay
    setTimeout(() => {
      onUpdate(localData);
      setIsSaving(false);
      // No alert, better UX
    }, 800);
  };

  // Helper for rendering a touch-friendly input
  const TouchInput = ({ value, onChange, colorClass }: { value: number, onChange: (val: string) => void, colorClass: string }) => (
    <input 
      type="text" 
      inputMode="numeric" 
      pattern="[0-9]*"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full h-12 text-center text-lg font-semibold border rounded-lg focus:ring-2 focus:ring-offset-1 outline-none transition-all ${colorClass}`}
    />
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <RefreshCw className="text-blue-600 mt-1 shrink-0" size={20} />
        <div>
          <h3 className="font-bold text-blue-800">Modo Edición Táctil</h3>
          <p className="text-sm text-blue-700">Use el teclado numérico. Los cambios actualizan el modelo predictivo.</p>
        </div>
      </div>

      {/* Desktop/Landscape Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-800">Servicio</th>
                <th className="px-6 py-4 text-center w-32">Total Camas</th>
                <th className="px-6 py-4 text-center w-40 text-red-700">Ocupadas</th>
                <th className="px-6 py-4 text-center w-40 text-green-700">Altas Prob.</th>
                <th className="px-6 py-4 text-center w-40 text-orange-700">En Espera</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {localData.map((service) => (
                <tr key={service.id} className="bg-white hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900 text-base">{service.name}</td>
                  <td className="px-6 py-4 text-center font-mono text-slate-500 text-lg">{service.totalBeds}</td>
                  <td className="px-6 py-4">
                    <TouchInput 
                      value={service.occupiedBeds} 
                      onChange={(v) => handleChange(service.id, 'occupiedBeds', v)} 
                      colorClass="border-red-200 focus:border-red-500 focus:ring-red-200 text-red-700 bg-red-50"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <TouchInput 
                      value={service.probableDischarges} 
                      onChange={(v) => handleChange(service.id, 'probableDischarges', v)} 
                      colorClass="border-green-200 focus:border-green-500 focus:ring-green-200 text-green-700 bg-green-50"
                    />
                  </td>
                  <td className="px-6 py-4">
                     <TouchInput 
                      value={service.pendingAdmission} 
                      onChange={(v) => handleChange(service.id, 'pendingAdmission', v)} 
                      colorClass="border-orange-200 focus:border-orange-500 focus:ring-orange-200 text-orange-700 bg-orange-50"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Portrait Card View */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {localData.map((service) => (
          <div key={service.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-xl text-slate-800">{service.name}</h3>
              <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">Cap: {service.totalBeds}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-red-600 uppercase block text-center">Ocupadas</label>
                <TouchInput 
                  value={service.occupiedBeds} 
                  onChange={(v) => handleChange(service.id, 'occupiedBeds', v)} 
                  colorClass="border-red-200 text-red-800 bg-red-50 h-14 text-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-green-600 uppercase block text-center">Altas</label>
                <TouchInput 
                  value={service.probableDischarges} 
                  onChange={(v) => handleChange(service.id, 'probableDischarges', v)} 
                  colorClass="border-green-200 text-green-800 bg-green-50 h-14 text-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-orange-600 uppercase block text-center">Espera</label>
                <TouchInput 
                  value={service.pendingAdmission} 
                  onChange={(v) => handleChange(service.id, 'pendingAdmission', v)} 
                  colorClass="border-orange-200 text-orange-800 bg-orange-50 h-14 text-xl"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button Area for Mobile / Fixed for Desktop */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 md:relative md:bg-transparent md:border-0 md:p-0 z-30 flex justify-end md:justify-end">
         <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-lg font-bold py-4 px-8 rounded-xl shadow-lg shadow-blue-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3"
        >
          {isSaving ? (
            <>
              <RefreshCw className="animate-spin" size={24} /> Guardando...
            </>
          ) : (
            <>
              <Save size={24} /> Guardar Cambios
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DataEntryForm;