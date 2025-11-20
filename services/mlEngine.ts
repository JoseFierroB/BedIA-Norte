import { ServiceData, ServiceType, RiskLevel } from '../types';

/**
 * MACHINE LEARNING ENGINE (Simulation)
 * 
 * In a production architecture, this file would be an API Client calling a Python service 
 * running XGBoost, LightGBM, or Random Forest models.
 * 
 * Why separate this?
 * LLMs are bad at math and consistent logic. Traditional ML is great at it.
 * We calculate the numbers here deterministically and feed them to the LLM as facts.
 */

interface MLPrediction {
  calculatedRisk: RiskLevel;
  predictedDischarges: number;
  criticalServices: string[];
  systemStressScore: number; // 0 to 1
}

export const runHeuristicModel = (services: ServiceData[]): MLPrediction => {
  let totalOccupancy = 0;
  let totalCapacity = 0;
  let criticalServices: string[] = [];
  let weightedDischargePrediction = 0;

  services.forEach(s => {
    const occupancyRate = s.totalBeds > 0 ? s.occupiedBeds / s.totalBeds : 0;
    totalOccupancy += s.occupiedBeds;
    totalCapacity += s.totalBeds;

    // "Feature Engineering" logic
    if (occupancyRate > 0.95 || (s.name === ServiceType.URGENCIA && s.pendingAdmission > 10)) {
      criticalServices.push(s.name);
    }

    // Predictive Logic (Simulating a regression model)
    // Base discharges (manual input) + Factor based on historical turnover rates per service
    let turnoverFactor = 1.0;
    if (s.name === ServiceType.MEDICINA) turnoverFactor = 1.2; // Higher volatility
    if (s.name === ServiceType.UPC) turnoverFactor = 0.8; // Slower turnover

    weightedDischargePrediction += Math.round(s.probableDischarges * turnoverFactor);
  });

  const globalOccupancy = totalCapacity > 0 ? totalOccupancy / totalCapacity : 0;
  
  // Classification Logic (Simulating a Decision Tree)
  let risk = RiskLevel.LOW;
  if (globalOccupancy > 0.85) risk = RiskLevel.MEDIUM;
  if (globalOccupancy > 0.92 || criticalServices.includes(ServiceType.URGENCIA)) risk = RiskLevel.HIGH;

  return {
    calculatedRisk: risk,
    predictedDischarges: weightedDischargePrediction,
    criticalServices,
    systemStressScore: globalOccupancy
  };
};