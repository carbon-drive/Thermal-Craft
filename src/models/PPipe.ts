/**
 * P-PIPE: Hydraulic Network Data Model
 * Represents the pipe network for underfloor heating
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface PipeSegment {
  id: string;
  /** Start point in meters */
  start: Point2D;
  /** End point in meters */
  end: Point2D;
  /** Pipe diameter in meters */
  diameter: number;
  /** Is this segment curved? */
  is_curved: boolean;
  /** For curved segments: control points for spline interpolation */
  control_points?: Point2D[];
  /** Bend radius in meters (if curved) */
  bend_radius?: number;
}

export interface HeatingCircuit {
  id: string;
  /** Room this circuit serves */
  room_id: string;
  /** All pipe segments in this circuit */
  segments: PipeSegment[];
  /** Flow rate in liters per hour */
  flow_rate: number;
  /** Supply temperature in °C */
  supply_temperature: number;
  /** Return temperature in °C */
  return_temperature: number;
}

export interface PPipeNetwork {
  /** All heating circuits */
  circuits: HeatingCircuit[];
  /** Spacing between pipes in meters (Verlegeabstand - VA) */
  pipe_spacing: number;
}

/**
 * Physical constants for hydraulic calculations
 */
export const HYDRAULIC_CONSTANTS = {
  /** Water density at 20°C in kg/m³ */
  WATER_DENSITY: 998.2,
  /** Dynamic viscosity of water at 20°C in Pa·s */
  WATER_VISCOSITY: 0.001002,
  /** Roughness of plastic pipes in meters */
  PIPE_ROUGHNESS: 0.0000015,
  /** Critical pressure loss threshold in mbar */
  CRITICAL_PRESSURE_LOSS: 300,
};

/**
 * Calculate the length of a pipe segment
 * @param segment Pipe segment
 * @returns Length in meters
 */
export function calculateSegmentLength(segment: PipeSegment): number {
  if (!segment.is_curved) {
    // Straight segment: Euclidean distance
    const dx = segment.end.x - segment.start.x;
    const dy = segment.end.y - segment.start.y;
    return Math.sqrt(dx * dx + dy * dy);
  } else {
    // Curved segment: approximate using arc length
    if (segment.bend_radius) {
      // Calculate angle based on start and end positions
      const dx = segment.end.x - segment.start.x;
      const dy = segment.end.y - segment.start.y;
      const chordLength = Math.sqrt(dx * dx + dy * dy);
      const radius = segment.bend_radius;
      
      // Use arc length formula: L = r * θ
      // where θ = 2 * arcsin(chord / (2*r))
      // Clamp the ratio to [-1, 1] to avoid domain errors in Math.asin
      const ratio = chordLength / (2 * radius);
      const clampedRatio = Math.max(-1, Math.min(1, ratio));
      const angle = 2 * Math.asin(clampedRatio);
      return radius * angle;
    } else if (segment.control_points && segment.control_points.length > 0) {
      // Approximate spline length using control points
      let length = 0;
      let prev = segment.start;
      
      for (const cp of segment.control_points) {
        const dx = cp.x - prev.x;
        const dy = cp.y - prev.y;
        length += Math.sqrt(dx * dx + dy * dy);
        prev = cp;
      }
      
      // Add final segment to end
      const dx = segment.end.x - prev.x;
      const dy = segment.end.y - prev.y;
      length += Math.sqrt(dx * dx + dy * dy);
      
      return length;
    }
  }
  
  // Fallback to straight line
  const dx = segment.end.x - segment.start.x;
  const dy = segment.end.y - segment.start.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate total pipe length for a circuit
 * @param circuit Heating circuit
 * @returns Total length in meters
 */
export function calculateCircuitLength(circuit: HeatingCircuit): number {
  return circuit.segments.reduce(
    (total, segment) => total + calculateSegmentLength(segment),
    0
  );
}

/**
 * Calculate Reynolds number for flow
 * @param velocity Flow velocity in m/s
 * @param diameter Pipe diameter in meters
 * @returns Reynolds number (dimensionless)
 */
function calculateReynolds(velocity: number, diameter: number): number {
  return (
    (HYDRAULIC_CONSTANTS.WATER_DENSITY * velocity * diameter) /
    HYDRAULIC_CONSTANTS.WATER_VISCOSITY
  );
}

/**
 * Calculate friction factor using Swamee-Jain equation
 * @param reynolds Reynolds number
 * @param diameter Pipe diameter in meters
 * @returns Friction factor (dimensionless)
 */
function calculateFrictionFactor(reynolds: number, diameter: number): number {
  const roughness = HYDRAULIC_CONSTANTS.PIPE_ROUGHNESS;
  const term1 = roughness / (3.7 * diameter);
  const term2 = 5.74 / Math.pow(reynolds, 0.9);
  
  return 0.25 / Math.pow(Math.log10(term1 + term2), 2);
}

/**
 * Calculate pressure loss (Δp) for a heating circuit
 * Uses Darcy-Weisbach equation: Δp = f * (L/D) * (ρ * v²/2)
 * 
 * @param circuit Heating circuit
 * @returns Pressure loss in mbar
 */
export function calculatePressureLoss(circuit: HeatingCircuit): number {
  const length = calculateCircuitLength(circuit);
  
  // Convert flow rate from L/h to m³/s
  const flowRateCubicMetersPerSec = circuit.flow_rate / 3600 / 1000;
  
  // Get average pipe diameter (use first segment as representative)
  if (circuit.segments.length === 0) return 0;
  const diameter = circuit.segments[0].diameter;
  
  // Calculate velocity
  const area = Math.PI * Math.pow(diameter / 2, 2);
  const velocity = flowRateCubicMetersPerSec / area;
  
  // Calculate Reynolds number
  const reynolds = calculateReynolds(velocity, diameter);
  
  // Calculate friction factor
  const frictionFactor = calculateFrictionFactor(reynolds, diameter);
  
  // Calculate pressure loss in Pascals
  const pressureLossPa =
    frictionFactor *
    (length / diameter) *
    (HYDRAULIC_CONSTANTS.WATER_DENSITY * Math.pow(velocity, 2) / 2);
  
  // Convert Pascals to mbar (1 Pa = 0.01 mbar)
  return pressureLossPa * 0.01;
}

/**
 * Check if a circuit has critical pressure loss
 * @param circuit Heating circuit
 * @returns True if pressure loss exceeds 300 mbar
 */
export function isCriticalCircuit(circuit: HeatingCircuit): boolean {
  const pressureLoss = calculatePressureLoss(circuit);
  return pressureLoss > HYDRAULIC_CONSTANTS.CRITICAL_PRESSURE_LOSS;
}
