# Domain-Specific Languages (DSLs) Documentation

## 1. L-FLOOR: Physical Environment DSL

### Overview
L-FLOOR is a YAML-based DSL for describing building structures with thermal properties. It enables accurate heat loss calculations and thermal performance analysis.

### Schema

```yaml
building_name: string              # Building identifier
building_year: number (optional)   # Construction year (affects material defaults)
grid_size: number                  # Grid size in meters (default: 0.125 = 12.5 cm)

rooms:
  - id: string                     # Unique room identifier
    name: string                   # Human-readable room name
    area: number                   # Floor area in m²
    height: number                 # Ceiling height in meters
    target_temperature: number     # Desired temperature in °C
    
    walls:
      - id: string                 # Unique wall identifier
        length: number             # Wall length in meters
        height: number             # Wall height in meters
        is_exterior: boolean       # Is this an exterior wall?
        material:
          name: string             # Material name
          description: string      # Optional description
          material_density: number # Density in kg/m³
          u_value: number          # Thermal transmittance in W/(m²·K)
          thermal_bridge_coefficient: number  # In W/(m·K)
    
    windows:
      - id: string                 # Unique window identifier
        width: number              # Window width in meters
        height: number             # Window height in meters
        glazing_type: 1|2|3        # 1=single, 2=double, 3=triple
        u_value: number            # Thermal transmittance in W/(m²·K)
```

### Special Materials

#### 1957 Hollow Block Stones (Hohlblockstein)
- **Characteristics**: High air chamber content, low thermal mass
- **Density**: 800 kg/m³
- **U-value**: 1.4 W/(m²·K)
- **Thermal Bridge Coefficient**: 0.15 W/(m·K)
- **Historical Context**: Common construction material in post-war Germany

### Standard Values

#### Window U-Values (W/(m²·K))
- **Single glazing (1-fach)**: 5.8
- **Double glazing (2-fach)**: 2.8
- **Triple glazing (3-fach)**: 0.8

### Heat Loss Calculation

The L-FLOOR parser automatically calculates heat loss using:

```
Q_wall = U × A × ΔT + ψ × L × ΔT
Q_window = U_window × A_window × ΔT

Where:
  U = U-value (W/(m²·K))
  A = Area (m²)
  ΔT = Temperature difference (K)
  ψ = Thermal bridge coefficient (W/(m·K))
  L = Length (m)
```

### Example

```yaml
building_name: "Waschenbach House"
building_year: 1957
grid_size: 0.125

rooms:
  - id: "living_room"
    name: "Wohnzimmer"
    area: 24.5
    height: 2.5
    target_temperature: 21
    walls:
      - id: "living_north"
        length: 5.5
        height: 2.5
        is_exterior: true
        material:
          name: "Hohlblockstein 1957"
          material_density: 800
          u_value: 1.4
          thermal_bridge_coefficient: 0.15
    windows:
      - id: "living_window_1"
        width: 1.5
        height: 1.4
        glazing_type: 1
        u_value: 5.8
```

---

## 2. P-PIPE: Hydraulic Network DSL

### Overview
P-PIPE defines the pipe network geometry and hydraulic properties for underfloor heating systems.

### Data Model

```typescript
interface Point2D {
  x: number;  // X coordinate in meters
  y: number;  // Y coordinate in meters
}

interface PipeSegment {
  id: string;
  start: Point2D;
  end: Point2D;
  diameter: number;           // Pipe diameter in meters
  is_curved: boolean;         // Is this segment curved?
  control_points?: Point2D[]; // For spline interpolation
  bend_radius?: number;       // Bend radius in meters (for curved segments)
}

interface HeatingCircuit {
  id: string;
  room_id: string;            // Associated room
  segments: PipeSegment[];    // All pipe segments
  flow_rate: number;          // Flow rate in L/h
  supply_temperature: number; // Supply temp in °C
  return_temperature: number; // Return temp in °C
}

interface PPipeNetwork {
  circuits: HeatingCircuit[];
  pipe_spacing: number;       // Spacing between pipes (VA) in meters
}
```

### Geometric Features

#### Straight Segments
- Defined by start and end points
- Length calculated using Euclidean distance

#### Curved Segments
Two methods supported:

1. **Arc with Bend Radius**
   - Uses arc length formula: `L = r × θ`
   - Typical bend radius for PE-Xa pipes: half the pipe spacing

2. **Spline Interpolation**
   - Uses control points for complex curves
   - Length approximated by summing segment distances

### Hydraulic Calculations

#### Pressure Loss (Darcy-Weisbach Equation)
```
Δp = f × (L/D) × (ρ × v²/2)

Where:
  f = Friction factor (calculated using Swamee-Jain)
  L = Total pipe length (m)
  D = Pipe diameter (m)
  ρ = Water density (998.2 kg/m³ at 20°C)
  v = Flow velocity (m/s)
```

#### Friction Factor (Swamee-Jain Equation)
```
f = 0.25 / [log₁₀(ε/(3.7D) + 5.74/Re^0.9)]²

Where:
  ε = Pipe roughness (0.0000015 m for plastic)
  D = Diameter (m)
  Re = Reynolds number
```

#### Reynolds Number
```
Re = (ρ × v × D) / μ

Where:
  μ = Dynamic viscosity (0.001002 Pa·s for water at 20°C)
```

#### Critical Circuit Detection
- **Threshold**: 300 mbar
- **Impact**: Circuits exceeding this threshold overload the pump
- **Solution**: Reduce pipe length, increase diameter, or reduce flow rate

### Layout Patterns

#### Serpentine (Meander) Layout
- Most common pattern for rectangular rooms
- Alternating direction with 180° turns
- Optimizes uniform heat distribution
- Turn radius typically = pipe spacing / 2

### Physical Constants

```typescript
HYDRAULIC_CONSTANTS = {
  WATER_DENSITY: 998.2,        // kg/m³ at 20°C
  WATER_VISCOSITY: 0.001002,   // Pa·s at 20°C
  PIPE_ROUGHNESS: 0.0000015,   // m (for plastic pipes)
  CRITICAL_PRESSURE_LOSS: 300  // mbar
}
```

---

## 3. COST-API: Material Pricing DSL

### Overview
JSON-based interface for material costs and budget management based on 2025 market prices.

### Data Model

```typescript
interface MaterialPrice {
  id: string;              // Unique material identifier
  name: string;            // Material name (German)
  unit: string;            // Unit of measurement
  price_per_unit: number;  // Price in EUR
  description?: string;    // Optional description
}

interface CostDatabase {
  last_updated: string;    // ISO date string
  currency: string;        // Currency code (EUR)
  materials: MaterialPrice[];
}
```

### Standard Material Prices (2025)

| Material ID | Name | Unit | Price (EUR) |
|------------|------|------|-------------|
| `pipe_16mm` | PE-Xa Rohr 16mm (QuickTherm) | meter | 4.50 |
| `pipe_20mm` | PE-Xa Rohr 20mm (QuickTherm) | meter | 5.80 |
| `eps_plate_30mm` | EPS-Dämmplatte 30mm | m² | 8.50 |
| `eps_plate_50mm` | EPS-Dämmplatte 50mm | m² | 12.00 |
| `alu_sheet` | Alu-Verteilerblech | m² | 18.00 |
| `window_single` | Fenster einfach verglast | m² | 150.00 |
| `window_double` | Fenster zweifach verglast | m² | 280.00 |
| `window_triple` | Fenster dreifach verglast | m² | 450.00 |
| `manifold` | Heizkreisverteiler | piece | 350.00 |
| `pump` | Hocheffizienzpumpe | piece | 420.00 |
| `thermostat` | Raumthermostat | piece | 85.00 |

### Budget Management

```typescript
interface Budget {
  total_budget: number;      // Available budget in EUR
  items: BudgetItem[];       // Purchased items
  total_spent: number;       // Total expenditure
  remaining_budget: number;  // Budget remaining
}

interface BudgetItem {
  material_id: string;       // Reference to material
  quantity: number;          // Amount purchased
  unit_price: number;        // Price per unit
  total_price: number;       // Line total
}
```

### Performance Metrics

#### Cost per Kelvin
Measures the cost-effectiveness of heating improvements:

```
Cost/K = Total Cost / Temperature Improvement

Example:
- Total cost: €10,000
- Temperature improvement: 5 K
- Cost per Kelvin: €2,000/K
```

Lower values indicate better cost-effectiveness.

### Usage Example

```typescript
import { calculateBudget, isWithinBudget } from './models/CostAPI';

const budget = calculateBudget(15000, [
  { material_id: 'pipe_16mm', quantity: 110 },
  { material_id: 'eps_plate_30mm', quantity: 13 },
  { material_id: 'window_triple', quantity: 4.2 },
  { material_id: 'manifold', quantity: 1 },
]);

if (isWithinBudget(budget)) {
  console.log(`Project cost: €${budget.total_spent}`);
  console.log(`Remaining: €${budget.remaining_budget}`);
}
```

---

## Integration Example

### Complete Workflow

1. **Define Building** (L-FLOOR)
   - Create YAML file with rooms, walls, windows
   - Specify thermal properties

2. **Calculate Heat Requirements**
   - Parse L-FLOOR data
   - Calculate heat loss for each room
   - Determine required heating capacity

3. **Design Hydraulic Circuit** (P-PIPE)
   - Generate pipe layout (serpentine pattern)
   - Calculate total pipe length
   - Compute pressure loss
   - Verify circuit is not critical

4. **Budget Analysis** (COST-API)
   - Calculate material costs
   - Check against budget constraints
   - Optimize material selection

5. **Iterate**
   - Adjust window glazing types
   - Modify pipe layouts
   - Balance cost vs. performance

---

## API Reference

### TypeScript Modules

```typescript
// L-FLOOR
import {
  parseLFloorYAML,
} from './parsers/LFloorParser';
import {
  calculateRoomHeatLoss,
  HOLLOW_BLOCK_1957,
  WINDOW_U_VALUES,
} from './models/LFloor';

// P-PIPE
import {
  calculateCircuitLength,
  calculatePressureLoss,
  isCriticalCircuit,
  HYDRAULIC_CONSTANTS,
} from './models/PPipe';

// COST-API
import {
  calculateBudget,
  isWithinBudget,
  calculateCostPerKelvin,
  MATERIAL_COSTS_2025,
} from './models/CostAPI';

// Hydraulic Solver
import {
  solveHydraulicCircuit,
  solveKitchenPrototype,
} from './solvers/HydraulicSolver';
```

### Command Line

```bash
# Build the project
npm run build

# Run demo (kitchen circuit + Waschenbach analysis)
npm run demo
```

---

## References

### Technical Standards
- DIN EN 1264: Underfloor heating systems
- DIN 4108: Thermal protection in buildings
- VDI 2077: Energy consumption of room heating systems

### Physical Properties
- Water properties at 20°C (used for hydraulic calculations)
- PE-Xa pipe characteristics (crosslinked polyethylene)
- EPS insulation properties (expanded polystyrene)

### Game Mechanics
- Budget constraints reflect realistic renovation scenarios
- Temperature limits protect flooring materials
- Pressure thresholds prevent pump damage
