/**
 * L-FLOOR YAML Parser
 * Parses YAML files containing building and room data
 */

import * as yaml from 'js-yaml';
import * as fs from 'fs';
import {
  LFloorData,
  Room,
  Wall,
  Window,
  MaterialProperties,
  HOLLOW_BLOCK_1957,
  WINDOW_U_VALUES,
} from '../models/LFloor';

/**
 * Parse L-FLOOR data from YAML file
 * @param filePath Path to YAML file
 * @returns Parsed L-FLOOR data
 */
export function parseLFloorYAML(filePath: string): LFloorData {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const data = yaml.load(fileContents) as any;

  return {
    building_name: data.building_name || 'Unnamed Building',
    building_year: data.building_year,
    grid_size: data.grid_size || 0.125, // Default 12.5 cm
    rooms: parseRooms(data.rooms || []),
  };
}

/**
 * Parse rooms from YAML data
 */
function parseRooms(roomsData: any[]): Room[] {
  return roomsData.map((roomData) => {
    return {
      id: roomData.id,
      name: roomData.name,
      area: roomData.area,
      height: roomData.height || 2.5, // Default 2.5m ceiling height
      target_temperature: roomData.target_temperature || 21,
      walls: parseWalls(roomData.walls || []),
      windows: parseWindows(roomData.windows || []),
    };
  });
}

/**
 * Parse walls from YAML data
 */
function parseWalls(wallsData: any[]): Wall[] {
  return wallsData.map((wallData) => {
    return {
      id: wallData.id,
      length: wallData.length,
      height: wallData.height,
      material: parseMaterial(wallData.material),
      is_exterior: wallData.is_exterior || false,
    };
  });
}

/**
 * Parse material properties from YAML data
 */
function parseMaterial(materialData: any): MaterialProperties {
  // Check for special materials
  if (
    materialData.name &&
    materialData.name.toLowerCase().includes('hohlblock')
  ) {
    return HOLLOW_BLOCK_1957;
  }

  return {
    name: materialData.name || 'Unknown',
    description: materialData.description,
    material_density: materialData.material_density || 0,
    u_value: materialData.u_value || 0,
    thermal_bridge_coefficient:
      materialData.thermal_bridge_coefficient || 0,
  };
}

/**
 * Parse windows from YAML data
 */
function parseWindows(windowsData: any[]): Window[] {
  return windowsData.map((windowData) => {
    const glazingType = windowData.glazing_type || 1;
    
    // Get standard U-value based on glazing type if not provided
    let uValue = windowData.u_value;
    if (!uValue) {
      switch (glazingType) {
        case 1:
          uValue = WINDOW_U_VALUES.single;
          break;
        case 2:
          uValue = WINDOW_U_VALUES.double;
          break;
        case 3:
          uValue = WINDOW_U_VALUES.triple;
          break;
        default:
          uValue = WINDOW_U_VALUES.single;
      }
    }

    return {
      id: windowData.id,
      width: windowData.width,
      height: windowData.height,
      glazing_type: glazingType,
      u_value: uValue,
    };
  });
}

/**
 * Serialize L-FLOOR data to YAML
 * @param data L-FLOOR data
 * @returns YAML string
 */
export function serializeLFloorYAML(data: LFloorData): string {
  return yaml.dump(data);
}

/**
 * Write L-FLOOR data to YAML file
 * @param data L-FLOOR data
 * @param filePath Output file path
 */
export function writeLFloorYAML(data: LFloorData, filePath: string): void {
  const yamlStr = serializeLFloorYAML(data);
  fs.writeFileSync(filePath, yamlStr, 'utf8');
}
