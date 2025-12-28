# Thermal-Craft

A simulation game about drawing floor heating plans and simulating them for performance.

## Overview

**Therma-Craft: The Retrofit Simulator** is an engineering dashboard that combines floor plan analysis, hydraulic planning, and thermodynamic simulation in a tycoon-style game. The game teaches real-world HVAC concepts through interactive gameplay based on actual retrofit scenarios.

## Core Features

### 1. L-FLOOR: Physical Environment Model
- YAML-based building structure definition
- Thermal resistance properties (R-values, U-values, thermal bridge coefficients)
- Support for historical materials (e.g., 1957 hollow block stones)
- Heat loss calculations for rooms and buildings

### 2. P-PIPE: Hydraulic Network System
- Pipe network geometry with spline interpolation for curves
- Real-time pressure loss calculations (Δp)
- Critical circuit detection (>300 mbar threshold = pump overload)
- Serpentine (meander) pipe layout generation

### 3. COST-API: Material Pricing
- JSON-based interface with 2025 material prices
- Budget tracking and validation
- Cost-per-Kelvin efficiency metrics
- QuickTherm system pricing included

## Installation

```bash
npm install
```

## Usage

### Build the project
```bash
npm run build
```

### Run the demo
```bash
npm run demo
```

The demo showcases:
- Hydraulic solver for a 13 m² kitchen with 12.5 cm pipe spacing
- Pipe length calculation: ~110 m for complete circuit
- Pressure loss calculation: ~126 mbar (well within limits)
- Material cost breakdown for QuickTherm system
- Heat loss analysis for the Waschenbach House (Level 1 challenge)

## Project Structure

```
src/
├── models/
│   ├── LFloor.ts       # Physical environment data model
│   ├── PPipe.ts        # Hydraulic network data model
│   └── CostAPI.ts      # Material pricing interface
├── parsers/
│   └── LFloorParser.ts # YAML parser for building data
├── solvers/
│   └── HydraulicSolver.ts # Hydraulic circuit solver
└── demo.ts             # Demo application

examples/
└── waschenbach_house.yaml # Level 1 challenge scenario
```

## Game Mechanics

### Level 1: The Waschenbach Challenge

**Scenario**: 1957 house with poor insulation and single-glazed windows

**Budget**: €15,000 for windows and heating system

**Objectives**:
1. Reach 21°C in living room during frost (-10°C exterior)
2. Keep supply temperature ≤ 35°C (protect click-laminate flooring)
3. Stay within budget

**Strategy**:
- Upgrade critical single-glazed windows (living room has biggest heat loss)
- Balance window upgrades with pipe installation costs
- Optimize hydraulic circuit for efficient heat distribution

## Technical Implementation

### Hydraulic Calculations

The pressure loss is calculated using the Darcy-Weisbach equation:

```
Δp = f × (L/D) × (ρ × v²/2)
```

Where:
- `f` = friction factor (calculated using Swamee-Jain equation)
- `L` = pipe length
- `D` = pipe diameter
- `ρ` = water density
- `v` = flow velocity

### Heat Loss Calculations

Room heat loss considers:
- Wall transmission losses: `Q = U × A × ΔT`
- Thermal bridge losses: `Q = ψ × L × ΔT`
- Window losses: `Q = U_window × A_window × ΔT`

### Material Properties

**1957 Hollow Block Stones** (Hohlblockstein):
- Density: 800 kg/m³ (low due to air chambers)
- U-value: 1.4 W/(m²·K) (poor insulation)
- Thermal bridge coefficient: 0.15 W/(m·K)

**Window U-values**:
- Single glazing (1-fach): 5.8 W/(m²·K)
- Double glazing (2-fach): 2.8 W/(m²·K)
- Triple glazing (3-fach): 0.8 W/(m²·K)

## Example Output

The kitchen circuit solver generates:
- **Pipe Length**: 110.69 m for 13 m² area with 12.5 cm spacing
- **Pressure Loss**: 126.1 mbar (safe, <300 mbar threshold)
- **Flow Rate**: 224 L/h
- **Material Costs**: €1,278 (pipes, insulation, manifold, thermostat)
- **Remaining Budget**: €13,722 for window upgrades and other rooms

## Future Enhancements

Planned features for full game implementation:

1. **UI/UX**: React + PixiJS for interactive floor plan editing
2. **Real-time Visualization**: Live heatmap overlay showing temperature distribution
3. **Advanced Simulation**: WebWorker-based FEM for thermal calculations
4. **Drawing Tools**: Snap-to-grid cursor with automatic bend radius calculation
5. **Telemetry Dashboard**: Real-time metrics for pipe length, comfort score, efficiency
6. **Multiple Levels**: Progressive scenarios with increasing complexity
7. **Performance Metrics**: Pump strain, cost per Kelvin, comfort score

## License

ISC

