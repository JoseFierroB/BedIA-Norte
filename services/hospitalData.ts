import { ServiceData, ServiceType } from '../types';

// Initial Mock Data reflecting the "Manual" state of HSJ
export const initialServiceData: ServiceData[] = [
  {
    id: 'urg',
    name: ServiceType.URGENCIA,
    totalBeds: 45,
    occupiedBeds: 45, // 100% occupancy typical of HSJ
    blockedBeds: 0,
    probableDischarges: 2,
    pendingAdmission: 15, // High pressure
  },
  {
    id: 'med',
    name: ServiceType.MEDICINA,
    totalBeds: 60,
    occupiedBeds: 58,
    blockedBeds: 1,
    probableDischarges: 8,
    pendingAdmission: 4,
  },
  {
    id: 'cir',
    name: ServiceType.CIRUGIA,
    totalBeds: 40,
    occupiedBeds: 35,
    blockedBeds: 2,
    probableDischarges: 5,
    pendingAdmission: 2,
  },
  {
    id: 'upc',
    name: ServiceType.UPC,
    totalBeds: 20,
    occupiedBeds: 19,
    blockedBeds: 0,
    probableDischarges: 1,
    pendingAdmission: 3,
  },
];

export const calculateOccupancy = (service: ServiceData): number => {
  if (service.totalBeds === 0) return 0;
  return Math.round((service.occupiedBeds / service.totalBeds) * 100);
};

export const getTotalStats = (services: ServiceData[]) => {
  const totalBeds = services.reduce((acc, s) => acc + s.totalBeds, 0);
  const occupied = services.reduce((acc, s) => acc + s.occupiedBeds, 0);
  const pending = services.reduce((acc, s) => acc + s.pendingAdmission, 0);
  const discharges = services.reduce((acc, s) => acc + s.probableDischarges, 0);
  
  return {
    totalBeds,
    occupied,
    occupancyRate: totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0,
    pending,
    discharges
  };
};