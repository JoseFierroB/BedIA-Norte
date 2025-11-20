import { ServiceData, ServiceType } from '../types';

// Initial Mock Data reflecting the "Manual" state of HSJ
export const initialServiceData: ServiceData[] = [
  {
    id: 'urg',
    name: ServiceType.URGENCIA,
    totalBeds: 45,
    occupiedBeds: 42, // High occupancy
    blockedBeds: 1,   // 1 blocked
    probableDischarges: 2,
    pendingAdmission: 15, // High pressure
  },
  {
    id: 'med',
    name: ServiceType.MEDICINA,
    totalBeds: 60,
    occupiedBeds: 55,
    blockedBeds: 3, // Isolation/Maintenance
    probableDischarges: 8,
    pendingAdmission: 4,
  },
  {
    id: 'cir',
    name: ServiceType.CIRUGIA,
    totalBeds: 40,
    occupiedBeds: 35,
    blockedBeds: 0,
    probableDischarges: 5,
    pendingAdmission: 2,
  },
  {
    id: 'upc',
    name: ServiceType.UPC,
    totalBeds: 20,
    occupiedBeds: 18,
    blockedBeds: 1, // Critical equipment failure usually
    probableDischarges: 1,
    pendingAdmission: 3,
  },
  {
    id: 'pab',
    name: ServiceType.PABELLON,
    totalBeds: 12,
    occupiedBeds: 8,
    blockedBeds: 0,
    probableDischarges: 4,
    pendingAdmission: 0,
  },
  {
    id: 'tra',
    name: ServiceType.TRAUMATOLOGIA,
    totalBeds: 25,
    occupiedBeds: 20,
    blockedBeds: 0,
    probableDischarges: 2,
    pendingAdmission: 1,
  }
];

export const calculateOccupancy = (service: ServiceData): number => {
  if (service.totalBeds === 0) return 0;
  return Math.round(((service.occupiedBeds + service.blockedBeds) / service.totalBeds) * 100);
};

export const getTotalStats = (services: ServiceData[]) => {
  const totalBeds = services.reduce((acc, s) => acc + s.totalBeds, 0);
  const occupied = services.reduce((acc, s) => acc + s.occupiedBeds, 0);
  const blocked = services.reduce((acc, s) => acc + s.blockedBeds, 0);
  const pending = services.reduce((acc, s) => acc + s.pendingAdmission, 0);
  const discharges = services.reduce((acc, s) => acc + s.probableDischarges, 0);
  
  // Effective occupancy includes blocked beds as they are not available
  const effectiveOccupancy = occupied + blocked;

  return {
    totalBeds,
    occupied,
    blocked,
    occupancyRate: totalBeds > 0 ? Math.round((effectiveOccupancy / totalBeds) * 100) : 0,
    pending,
    discharges
  };
};