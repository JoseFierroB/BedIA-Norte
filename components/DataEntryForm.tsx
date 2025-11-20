import React, { useState } from 'react';
import { ServiceData } from '../types';
import { Save, RefreshCw } from 'lucide-react';

interface DataEntryFormProps {
  services: ServiceData[];
  onUpdate: (updatedServices: ServiceData[]) => void;
}

const DataEntryForm: React.FC<DataEntryFormProps> = ({ services, onUpdate }) => {
  const [localData, setLocalData] = useState<ServiceData[]>(services);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (id: string, field: keyof ServiceData, value: string) => {
    const numValue = parseInt(value) || 0;
    setLocalData(prev => prev.map(s => s.id === id ? { ...s, [field]: numValue } : s));
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate network delay
    setTimeout(() => {
      onUpdate(localData);
      setIsSaving(false);
      alert("Datos actualizados correctamente. El modelo de IA recalculará las predicciones.");
    }, 800);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <RefreshCw size={18} className="text-blue-600" />
          Actualización de Censo (Manual)
        </h3>
        <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded">Reemplaza cuaderno de sala</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50">
            <tr>
              <th className="px-6 py-3">Servicio</th>
              <th className="px-6 py-3 text-center">Total Camas</th>
              <th className="px-6 py-3 text-center text-red-600">Ocupadas</th>
              <th className="px-6 py-3 text-center text-green-600">Altas Probables</th>
              <th className="px-6 py-3 text-center text-orange-600">Espera Ingreso</th>
            </tr>
          </thead>
          <tbody>
            {localData.map((service) => (
              <tr key={service.id} className="bg-white border-b hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{service.name}</td>
                <td className="px-6 py-4 text-center">{service.totalBeds}</td>
                <td className="px-6 py-4 text-center">
                  <input 
                    type="number" 
                    value={service.occupiedBeds}
                    onChange={(e) => handleChange(service.id, 'occupiedBeds', e.target.value)}
                    className="w-16 p-1 text-center border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <input 
                    type="number" 
                    value={service.probableDischarges}
                    onChange={(e) => handleChange(service.id, 'probableDischarges', e.target.value)}
                    className="w-16 p-1 text-center border border-green-300 rounded bg-green-50 focus:ring-2 focus:ring-green-500"
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <input 
                    type="number" 
                    value={service.pendingAdmission}
                    onChange={(e) => handleChange(service.id, 'pendingAdmission', e.target.value)}
                    className="w-16 p-1 text-center border border-orange-300 rounded bg-orange-50 focus:ring-2 focus:ring-orange-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-slate-50 flex justify-end">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          {isSaving ? 'Guardando...' : 'Guardar Cambios y Recalcular'}
        </button>
      </div>
    </div>
  );
};

export default DataEntryForm;