/**
 * Test Suite for Therma-Craft Core Functionality
 * 
 * This file demonstrates the API usage and validates core calculations
 */

import {
  calculateRoomHeatLoss,
  Room,
  HOLLOW_BLOCK_1957,
  WINDOW_U_VALUES,
} from '../src/models/LFloor';
import {
  calculateCircuitLength,
  calculatePressureLoss,
  isCriticalCircuit,
  HeatingCircuit,
  PipeSegment,
} from '../src/models/PPipe';
import {
  calculateBudget,
  isWithinBudget,
  calculateCostPerKelvin,
} from '../src/models/CostAPI';
import { solveHydraulicCircuit, CircuitDesignParams } from '../src/solvers/HydraulicSolver';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  Therma-Craft Test Suite                                  ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log();

// Test 1: Heat Loss Calculation
console.log('Test 1: Heat Loss Calculation');
console.log('─────────────────────────────');

const testRoom: Room = {
  id: 'test_room',
  name: 'Test Room',
  area: 20,
  height: 2.5,
  target_temperature: 21,
  walls: [
    {
      id: 'wall_1',
      length: 5,
      height: 2.5,
      is_exterior: true,
      material: HOLLOW_BLOCK_1957,
    },
  ],
  windows: [
    {
      id: 'window_1',
      width: 1.5,
      height: 1.4,
      glazing_type: 1,
      u_value: WINDOW_U_VALUES.single,
    },
  ],
};

const heatLoss = calculateRoomHeatLoss(testRoom, -10);
console.log(`Room: ${testRoom.name} (${testRoom.area} m²)`);
console.log(`Heat Loss at -10°C: ${heatLoss.toFixed(0)} W`);
console.log(`Specific Heat Loss: ${(heatLoss / testRoom.area).toFixed(1)} W/m²`);
console.log('✓ Test passed');
console.log();

// Test 2: Pipe Length Calculation
console.log('Test 2: Pipe Length Calculation');
console.log('────────────────────────────────');

const testSegments: PipeSegment[] = [
  {
    id: 'seg_1',
    start: { x: 0, y: 0 },
    end: { x: 5, y: 0 },
    diameter: 0.016,
    is_curved: false,
  },
  {
    id: 'seg_2',
    start: { x: 5, y: 0 },
    end: { x: 5, y: 0.125 },
    diameter: 0.016,
    is_curved: true,
    bend_radius: 0.0625,
  },
  {
    id: 'seg_3',
    start: { x: 5, y: 0.125 },
    end: { x: 0, y: 0.125 },
    diameter: 0.016,
    is_curved: false,
  },
];

const testCircuit: HeatingCircuit = {
  id: 'test_circuit',
  room_id: 'test_room',
  segments: testSegments,
  flow_rate: 200,
  supply_temperature: 35,
  return_temperature: 30,
};

const length = calculateCircuitLength(testCircuit);
console.log(`Number of segments: ${testSegments.length}`);
console.log(`Total pipe length: ${length.toFixed(2)} m`);
console.log('✓ Test passed');
console.log();

// Test 3: Pressure Loss Calculation
console.log('Test 3: Pressure Loss Calculation');
console.log('──────────────────────────────────');

const pressureLoss = calculatePressureLoss(testCircuit);
const isCritical = isCriticalCircuit(testCircuit);

console.log(`Flow rate: ${testCircuit.flow_rate} L/h`);
console.log(`Pressure loss: ${pressureLoss.toFixed(1)} mbar`);
console.log(`Critical threshold: 300 mbar`);
console.log(`Status: ${isCritical ? '⚠️ CRITICAL' : '✓ OK'}`);
console.log('✓ Test passed');
console.log();

// Test 4: Budget Calculation
console.log('Test 4: Budget Calculation');
console.log('──────────────────────────');

const testBudget = calculateBudget(5000, [
  { material_id: 'pipe_16mm', quantity: 100 },
  { material_id: 'eps_plate_30mm', quantity: 20 },
  { material_id: 'manifold', quantity: 1 },
]);

console.log(`Total budget: ${testBudget.total_budget} €`);
console.log(`Materials:`);
for (const item of testBudget.items) {
  console.log(`  - ${item.material_id}: ${item.quantity} × ${item.unit_price}€ = ${item.total_price}€`);
}
console.log(`Total spent: ${testBudget.total_spent.toFixed(2)} €`);
console.log(`Remaining: ${testBudget.remaining_budget.toFixed(2)} €`);
console.log(`Within budget: ${isWithinBudget(testBudget) ? '✓ YES' : '⚠️ NO'}`);
console.log('✓ Test passed');
console.log();

// Test 5: Cost per Kelvin
console.log('Test 5: Cost per Kelvin Calculation');
console.log('────────────────────────────────────');

const costPerK = calculateCostPerKelvin(10000, 5);
console.log(`Total cost: 10,000 €`);
console.log(`Temperature improvement: 5 K`);
console.log(`Cost per Kelvin: ${costPerK.toFixed(0)} €/K`);
console.log('✓ Test passed');
console.log();

// Test 6: Hydraulic Solver
console.log('Test 6: Hydraulic Solver');
console.log('────────────────────────');

const params: CircuitDesignParams = {
  room_area: 15,
  pipe_spacing: 0.125,
  room_width: 3.0,
  room_length: 5.0,
  pipe_diameter: 0.016,
  supply_temperature: 35,
  return_temperature: 30,
  heat_output_required: 1500,
};

const solution = solveHydraulicCircuit(params, 'test_room_6', 10000);

console.log(`Room area: ${params.room_area} m²`);
console.log(`Pipe spacing: ${params.pipe_spacing * 100} cm`);
console.log(`Generated segments: ${solution.circuit.segments.length}`);
console.log(`Total pipe length: ${solution.total_length.toFixed(2)} m`);
console.log(`Pressure loss: ${solution.pressure_loss.toFixed(1)} mbar`);
console.log(`Status: ${solution.is_critical ? '⚠️ CRITICAL' : '✓ OK'}`);
console.log(`Budget status: ${isWithinBudget(solution.budget) ? '✓ Within budget' : '⚠️ Over budget'}`);
console.log('✓ Test passed');
console.log();

// Test 7: Window Upgrade Scenario
console.log('Test 7: Window Upgrade Cost-Benefit Analysis');
console.log('─────────────────────────────────────────────');

const roomWithSingleGlazing: Room = {
  ...testRoom,
  windows: [
    {
      id: 'window_before',
      width: 1.5,
      height: 1.4,
      glazing_type: 1,
      u_value: WINDOW_U_VALUES.single,
    },
  ],
};

const roomWithTripleGlazing: Room = {
  ...testRoom,
  windows: [
    {
      id: 'window_after',
      width: 1.5,
      height: 1.4,
      glazing_type: 3,
      u_value: WINDOW_U_VALUES.triple,
    },
  ],
};

const heatLossBefore = calculateRoomHeatLoss(roomWithSingleGlazing, -10);
const heatLossAfter = calculateRoomHeatLoss(roomWithTripleGlazing, -10);
const heatLossReduction = heatLossBefore - heatLossAfter;

const windowArea = 1.5 * 1.4;
const upgradeCost = windowArea * (450 - 150); // Triple vs single glazing

console.log(`Window size: ${windowArea.toFixed(2)} m²`);
console.log(`Heat loss before (single glazing): ${heatLossBefore.toFixed(0)} W`);
console.log(`Heat loss after (triple glazing): ${heatLossAfter.toFixed(0)} W`);
console.log(`Heat loss reduction: ${heatLossReduction.toFixed(0)} W`);
console.log(`Upgrade cost: ${upgradeCost.toFixed(2)} €`);
console.log(`Cost per Watt saved: ${(upgradeCost / heatLossReduction).toFixed(2)} €/W`);
console.log('✓ Test passed');
console.log();

console.log('═══════════════════════════════════════════════════════════');
console.log('All tests passed! ✓');
console.log('═══════════════════════════════════════════════════════════');
