/**
 * Therma-Craft: The Retrofit Simulator
 * Main entry point for the library
 */

// Export L-FLOOR models and utilities
export {
  ThermalProperties,
  MaterialProperties,
  Wall,
  Window,
  Room,
  LFloorData,
  HOLLOW_BLOCK_1957,
  WINDOW_U_VALUES,
  calculateRoomHeatLoss,
} from './models/LFloor';

// Export P-PIPE models and utilities
export {
  Point2D,
  PipeSegment,
  HeatingCircuit,
  PPipeNetwork,
  HYDRAULIC_CONSTANTS,
  calculateSegmentLength,
  calculateCircuitLength,
  calculatePressureLoss,
  isCriticalCircuit,
} from './models/PPipe';

// Export COST-API models and utilities
export {
  MaterialPrice,
  CostDatabase,
  BudgetItem,
  Budget,
  MATERIAL_COSTS_2025,
  getMaterialPrice,
  calculateBudget,
  isWithinBudget,
  calculateCostPerKelvin,
} from './models/CostAPI';

// Export parsers
export {
  parseLFloorYAML,
  serializeLFloorYAML,
  writeLFloorYAML,
} from './parsers/LFloorParser';

// Export solvers
export {
  CircuitDesignParams,
  CircuitSolution,
  solveHydraulicCircuit,
  solveKitchenPrototype,
} from './solvers/HydraulicSolver';
