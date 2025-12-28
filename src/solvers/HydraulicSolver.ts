/**
 * Hydraulic Solver for Underfloor Heating Circuits
 * Prototype implementation for kitchen circuit (13 m² with 12.5 cm spacing)
 */

import {
  HeatingCircuit,
  PipeSegment,
  Point2D,
  calculateCircuitLength,
  calculatePressureLoss,
  isCriticalCircuit,
} from '../models/PPipe';
import {
  calculateBudget,
  isWithinBudget,
  Budget,
  MATERIAL_COSTS_2025,
} from '../models/CostAPI';

export interface CircuitDesignParams {
  /** Room area in m² */
  room_area: number;
  /** Pipe spacing in meters (Verlegeabstand) */
  pipe_spacing: number;
  /** Room dimensions: width in meters */
  room_width: number;
  /** Room dimensions: length in meters */
  room_length: number;
  /** Pipe diameter in meters */
  pipe_diameter: number;
  /** Supply temperature in °C */
  supply_temperature: number;
  /** Return temperature in °C */
  return_temperature: number;
  /** Heat output required in Watts */
  heat_output_required: number;
}

export interface CircuitSolution {
  /** Generated circuit */
  circuit: HeatingCircuit;
  /** Total pipe length in meters */
  total_length: number;
  /** Pressure loss in mbar */
  pressure_loss: number;
  /** Is circuit critical (>300 mbar)? */
  is_critical: boolean;
  /** Material costs */
  budget: Budget;
  /** Estimated heat output in Watts */
  estimated_heat_output: number;
  /** Flow rate in liters per hour */
  flow_rate: number;
}

/**
 * Generate a serpentine (meander) pipe layout for a rectangular room
 * @param params Circuit design parameters
 * @returns Array of pipe segments forming the circuit
 */
function generateSerpentineLayout(
  params: CircuitDesignParams
): PipeSegment[] {
  const segments: PipeSegment[] = [];
  const spacing = params.pipe_spacing;
  const width = params.room_width;
  const length = params.room_length;
  
  let segmentId = 0;
  let currentY = spacing / 2; // Start with half spacing from edge
  let direction = 1; // 1 = right, -1 = left

  while (currentY < length) {
    const startX = direction === 1 ? 0 : width;
    const endX = direction === 1 ? width : 0;

    segments.push({
      id: `seg_${segmentId++}`,
      start: { x: startX, y: currentY },
      end: { x: endX, y: currentY },
      diameter: params.pipe_diameter,
      is_curved: false,
    });

    // Add turn at the end if not the last row
    const nextY = currentY + spacing;
    if (nextY < length) {
      // 180-degree turn
      const turnStartX = endX;
      const turnEndX = endX;
      
      segments.push({
        id: `seg_${segmentId++}`,
        start: { x: turnStartX, y: currentY },
        end: { x: turnEndX, y: nextY },
        diameter: params.pipe_diameter,
        is_curved: true,
        bend_radius: spacing / 2, // Typical bend radius for PE-Xa pipes
      });
    }

    currentY = nextY;
    direction *= -1; // Switch direction
  }

  return segments;
}

/**
 * Calculate required flow rate for given heat output
 * Q = m_dot * c_p * ΔT
 * where m_dot = ρ * V_dot
 * 
 * @param heatOutput Heat output in Watts
 * @param supplyTemp Supply temperature in °C
 * @param returnTemp Return temperature in °C
 * @returns Flow rate in liters per hour
 */
function calculateRequiredFlowRate(
  heatOutput: number,
  supplyTemp: number,
  returnTemp: number
): number {
  const deltaT = supplyTemp - returnTemp;
  const c_p = 4186; // Specific heat capacity of water in J/(kg·K)
  const rho = 998.2; // Water density in kg/m³

  // Q = m_dot * c_p * ΔT
  // m_dot = Q / (c_p * ΔT)
  const massFlowRate = heatOutput / (c_p * deltaT); // kg/s

  // V_dot = m_dot / ρ
  const volumeFlowRate = massFlowRate / rho; // m³/s

  // Convert to liters per hour
  return volumeFlowRate * 1000 * 3600;
}

/**
 * Estimate heat output from a circuit
 * Simplified calculation based on pipe length and temperature difference
 * 
 * @param pipeLength Total pipe length in meters
 * @param supplyTemp Supply temperature in °C
 * @param roomTemp Room temperature in °C
 * @param pipeSpacing Pipe spacing in meters
 * @returns Estimated heat output in Watts
 */
function estimateHeatOutput(
  pipeLength: number,
  supplyTemp: number,
  roomTemp: number,
  pipeSpacing: number
): number {
  // Simplified heat transfer calculation
  // Q = k * A * ΔT where A is the effective heating area
  
  const avgTemp = (supplyTemp + (supplyTemp - 5)) / 2; // Assume 5°C drop
  const deltaT = avgTemp - roomTemp;
  
  // Heat output per meter of pipe (typical for underfloor heating)
  // Depends on spacing and temperature difference
  const q_per_meter = 10 + (deltaT * 2); // W/m (simplified empirical formula)
  
  return pipeLength * q_per_meter;
}

/**
 * Solve hydraulic circuit for a room
 * Creates a complete circuit design with cost calculation
 * 
 * @param params Circuit design parameters
 * @param roomId Room identifier
 * @param totalBudget Available budget in EUR
 * @returns Complete circuit solution
 */
export function solveHydraulicCircuit(
  params: CircuitDesignParams,
  roomId: string,
  totalBudget: number
): CircuitSolution {
  // Calculate required flow rate
  const flowRate = calculateRequiredFlowRate(
    params.heat_output_required,
    params.supply_temperature,
    params.return_temperature
  );

  // Generate serpentine layout
  const segments = generateSerpentineLayout(params);

  // Create circuit
  const circuit: HeatingCircuit = {
    id: `circuit_${roomId}`,
    room_id: roomId,
    segments: segments,
    flow_rate: flowRate,
    supply_temperature: params.supply_temperature,
    return_temperature: params.return_temperature,
  };

  // Calculate pipe length
  const totalLength = calculateCircuitLength(circuit);

  // Calculate pressure loss
  const pressureLoss = calculatePressureLoss(circuit);

  // Check if critical
  const isCrit = isCriticalCircuit(circuit);

  // Calculate material costs
  const pipeType =
    params.pipe_diameter >= 0.02 ? 'pipe_20mm' : 'pipe_16mm';
  
  const materialItems = [
    { material_id: pipeType, quantity: totalLength },
    { material_id: 'eps_plate_30mm', quantity: params.room_area },
    { material_id: 'alu_sheet', quantity: params.room_area },
    { material_id: 'manifold', quantity: 1 },
    { material_id: 'thermostat', quantity: 1 },
  ];

  const budget = calculateBudget(totalBudget, materialItems);

  // Estimate heat output
  const estimatedOutput = estimateHeatOutput(
    totalLength,
    params.supply_temperature,
    21, // Assume 21°C target room temperature
    params.pipe_spacing
  );

  return {
    circuit,
    total_length: totalLength,
    pressure_loss: pressureLoss,
    is_critical: isCrit,
    budget,
    estimated_heat_output: estimatedOutput,
    flow_rate: flowRate,
  };
}

/**
 * Prototype: Solve for kitchen circuit as specified in requirements
 * 13 m² kitchen with 12.5 cm pipe spacing
 */
export function solveKitchenPrototype(): CircuitSolution {
  // Kitchen parameters from requirements
  const kitchenParams: CircuitDesignParams = {
    room_area: 13.0, // 13 m²
    pipe_spacing: 0.125, // 12.5 cm (VA)
    room_width: 3.5, // Assume ~3.5m width
    room_length: 3.7, // ~3.7m length to get 13 m²
    pipe_diameter: 0.016, // 16mm standard pipe
    supply_temperature: 35, // Max 35°C to protect click-laminate flooring
    return_temperature: 30, // 5°C temperature drop
    heat_output_required: 1300, // ~100 W/m² for well-insulated modern kitchen
  };

  return solveHydraulicCircuit(kitchenParams, 'kitchen', 15000);
}
