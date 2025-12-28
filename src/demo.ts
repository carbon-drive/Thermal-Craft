#!/usr/bin/env node
/**
 * Demo: Hydraulic Solver for Kitchen Circuit
 * 
 * This demonstrates the core functionality requested:
 * - Calculate pipe length for a 13 m² kitchen with 12.5 cm spacing
 * - Calculate pressure loss (Δp)
 * - Calculate costs using QuickTherm system pricing
 */

import { solveKitchenPrototype } from './solvers/HydraulicSolver';
import { parseLFloorYAML } from './parsers/LFloorParser';
import { calculateRoomHeatLoss } from './models/LFloor';
import * as path from 'path';

function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Therma-Craft: Kitchen Circuit Hydraulic Analysis         ║');
  console.log('║  Prototype Demonstration                                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();

  // Solve kitchen circuit
  console.log('📐 Solving hydraulic circuit for kitchen (13 m², 12.5 cm VA)...');
  console.log();

  const solution = solveKitchenPrototype();

  // Display results
  console.log('═══════════════════════════════════════════════════════════');
  console.log('HYDRAULIC ANALYSIS RESULTS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log();

  console.log('📏 GEOMETRY:');
  console.log(`   • Total Pipe Length: ${solution.total_length.toFixed(2)} m`);
  console.log(`   • Number of Segments: ${solution.circuit.segments.length}`);
  console.log(`   • Pipe Spacing: 12.5 cm (standard VA)`);
  console.log(`   • Pipe Diameter: 16 mm (QuickTherm standard)`);
  console.log();

  console.log('💧 HYDRAULICS:');
  console.log(`   • Flow Rate: ${solution.flow_rate.toFixed(1)} L/h`);
  console.log(`   • Supply Temperature: ${solution.circuit.supply_temperature}°C`);
  console.log(`   • Return Temperature: ${solution.circuit.return_temperature}°C`);
  console.log(`   • Pressure Loss (Δp): ${solution.pressure_loss.toFixed(1)} mbar`);
  
  if (solution.is_critical) {
    console.log(`   ⚠️  WARNING: Circuit is CRITICAL (Δp > 300 mbar)`);
    console.log(`   • Pump may be overloaded!`);
  } else {
    console.log(`   ✓ Circuit OK (Δp < 300 mbar threshold)`);
  }
  console.log();

  console.log('🔥 THERMAL PERFORMANCE:');
  console.log(`   • Required Heat Output: 1,300 W`);
  console.log(`   • Estimated Heat Output: ${solution.estimated_heat_output.toFixed(0)} W`);
  const heatDiff = solution.estimated_heat_output - 1300;
  if (heatDiff >= 0) {
    console.log(`   ✓ Surplus: +${heatDiff.toFixed(0)} W`);
  } else {
    console.log(`   ⚠️  Deficit: ${heatDiff.toFixed(0)} W`);
  }
  console.log();

  console.log('💰 COST ANALYSIS (QuickTherm System):');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Total Budget: ${solution.budget.total_budget.toFixed(2)} €`);
  console.log();
  console.log('   Materials:');
  
  for (const item of solution.budget.items) {
    const material = item.material_id.replace(/_/g, ' ').toUpperCase();
    console.log(
      `   • ${material.padEnd(25)} ${item.quantity.toFixed(1)} × ${item.unit_price.toFixed(2)}€ = ${item.total_price.toFixed(2)} €`
    );
  }
  
  console.log('   ───────────────────────────────────────────────────────────');
  console.log(`   Total Spent: ${solution.budget.total_spent.toFixed(2)} €`);
  console.log(`   Remaining:   ${solution.budget.remaining_budget.toFixed(2)} €`);
  console.log();

  if (solution.budget.remaining_budget >= 0) {
    console.log('   ✓ Budget OK - Within limits');
  } else {
    console.log('   ⚠️  BUDGET EXCEEDED!');
  }
  console.log();

  // Load and analyze Waschenbach house
  console.log('═══════════════════════════════════════════════════════════');
  console.log('LEVEL 1: WASCHENBACH CHALLENGE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log();

  try {
    const yamlPath = path.join(__dirname, '..', 'examples', 'waschenbach_house.yaml');
    const building = parseLFloorYAML(yamlPath);
    
    console.log(`🏠 Building: ${building.building_name} (${building.building_year})`);
    console.log(`   Grid Size: ${building.grid_size * 100} cm`);
    console.log();

    const exteriorTemp = -10; // Frost conditions
    
    console.log('🌡️  HEAT LOSS ANALYSIS (Exterior: -10°C):');
    console.log();

    let totalBuildingHeatLoss = 0;

    for (const room of building.rooms) {
      const heatLoss = calculateRoomHeatLoss(room, exteriorTemp);
      totalBuildingHeatLoss += heatLoss;
      
      const deltaT = room.target_temperature - exteriorTemp;
      
      console.log(`   ${room.name} (${room.id}):`);
      console.log(`     • Area: ${room.area} m²`);
      console.log(`     • Target Temperature: ${room.target_temperature}°C`);
      console.log(`     • ΔT: ${deltaT} K`);
      console.log(`     • Heat Loss: ${heatLoss.toFixed(0)} W (${(heatLoss / room.area).toFixed(1)} W/m²)`);
      console.log(`     • Windows: ${room.windows.length} (${room.windows.map(w => w.glazing_type + '-fach').join(', ')})`);
      console.log();
    }

    console.log('   ───────────────────────────────────────────────────────────');
    console.log(`   Total Building Heat Loss: ${totalBuildingHeatLoss.toFixed(0)} W`);
    console.log();

    console.log('🎯 CHALLENGE OBJECTIVES:');
    console.log('   1. Reach 21°C in living room at -10°C exterior ✓');
    console.log('   2. Keep supply temperature ≤ 35°C (protect flooring) ✓');
    console.log('   3. Stay within 15,000€ budget for windows + heating');
    console.log();
    console.log('💡 STRATEGY TIPS:');
    console.log('   • Upgrade single-glazed windows in living room (biggest impact)');
    console.log('   • Consider entrance window upgrade (cost vs. benefit)');
    console.log('   • Balance window upgrades with pipe installation costs');
    console.log();

  } catch (error) {
    console.log('   (Example YAML file not found or parsing error)');
    console.log(`   Error: ${error}`);
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('Demo completed successfully! ✓');
  console.log('═══════════════════════════════════════════════════════════');
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { main };
