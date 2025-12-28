/**
 * L-FLOOR: Physical Environment Data Model
 * Represents the building structure with thermal properties
 */

export interface ThermalProperties {
  /** Material density in kg/m³ */
  material_density: number;
  /** U-value (thermal transmittance) in W/(m²·K) */
  u_value: number;
  /** Thermal bridge coefficient in W/(m·K) */
  thermal_bridge_coefficient: number;
}

export interface MaterialProperties extends ThermalProperties {
  /** Material name/type */
  name: string;
  /** Description of the material */
  description?: string;
}

/**
 * Special material: 1957 Hollow Block Stones
 * Characteristics: High air chamber content, low mass
 */
export const HOLLOW_BLOCK_1957: MaterialProperties = {
  name: 'Hohlblockstein 1957',
  description: 'Historical hollow block with high air chamber content and low mass',
  material_density: 800, // kg/m³ - relatively low due to air chambers
  u_value: 1.4, // W/(m²·K) - poor insulation by modern standards
  thermal_bridge_coefficient: 0.15, // W/(m·K) - moderate thermal bridging
};

export interface Wall {
  id: string;
  /** Length in meters */
  length: number;
  /** Height in meters */
  height: number;
  /** Material properties */
  material: MaterialProperties;
  /** Is this an exterior wall? */
  is_exterior: boolean;
}

export interface Window {
  id: string;
  /** Width in meters */
  width: number;
  /** Height in meters */
  height: number;
  /** Glazing type: 1 = single, 2 = double, 3 = triple */
  glazing_type: 1 | 2 | 3;
  /** U-value for the window in W/(m²·K) */
  u_value: number;
}

export interface Room {
  id: string;
  name: string;
  /** Floor area in m² */
  area: number;
  /** Room height in meters */
  height: number;
  /** Target temperature in °C */
  target_temperature: number;
  /** Walls in this room */
  walls: Wall[];
  /** Windows in this room */
  windows: Window[];
}

export interface LFloorData {
  /** Building name/identifier */
  building_name: string;
  /** Building year (important for material defaults) */
  building_year?: number;
  /** List of rooms */
  rooms: Room[];
  /** Grid size for layout planning in meters (default 0.125m = 12.5cm) */
  grid_size: number;
}

/**
 * Calculate total heat loss for a room in Watts
 * @param room Room to calculate
 * @param exterior_temp Exterior temperature in °C
 * @returns Heat loss in Watts
 */
export function calculateRoomHeatLoss(
  room: Room,
  exterior_temp: number
): number {
  const deltaT = room.target_temperature - exterior_temp;
  let totalHeatLoss = 0;

  // Heat loss through walls
  for (const wall of room.walls) {
    if (wall.is_exterior) {
      const area = wall.length * wall.height;
      const wallLoss = wall.material.u_value * area * deltaT;
      
      // Add thermal bridge losses
      const bridgeLoss = wall.material.thermal_bridge_coefficient * wall.length * deltaT;
      
      totalHeatLoss += wallLoss + bridgeLoss;
    }
  }

  // Heat loss through windows
  for (const window of room.windows) {
    const area = window.width * window.height;
    const windowLoss = window.u_value * area * deltaT;
    totalHeatLoss += windowLoss;
  }

  return totalHeatLoss;
}

/**
 * Standard U-values for windows (W/(m²·K))
 */
export const WINDOW_U_VALUES = {
  single: 5.8,  // Single glazing (1-fach)
  double: 2.8,  // Double glazing (2-fach)
  triple: 0.8,  // Triple glazing (3-fach)
};
