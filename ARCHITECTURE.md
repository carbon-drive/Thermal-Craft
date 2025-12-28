# System Architecture

## Overview

Therma-Craft is designed as a modular simulation engine with three core Domain-Specific Languages (DSLs) that work together to model, simulate, and optimize underfloor heating retrofit scenarios.

```
┌─────────────────────────────────────────────────────────────────┐
│                     THERMA-CRAFT SIMULATOR                      │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │   L-FLOOR     │  │    P-PIPE     │  │   COST-API    │      │
│  │   Physical    │  │   Hydraulic   │  │   Material    │      │
│  │  Environment  │  │    Network    │  │    Pricing    │      │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘      │
│          │                  │                  │               │
│          └──────────────────┼──────────────────┘               │
│                             │                                  │
│                    ┌────────▼────────┐                         │
│                    │  HYDRAULIC      │                         │
│                    │    SOLVER       │                         │
│                    └────────┬────────┘                         │
│                             │                                  │
│                    ┌────────▼────────┐                         │
│                    │   SIMULATION    │                         │
│                    │     ENGINE      │                         │
│                    └─────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Input Phase
```
User Input (YAML)
      │
      ▼
┌─────────────┐
│  L-FLOOR    │  Building structure, materials, windows
│   Parser    │  → Thermal properties
└──────┬──────┘
       │
       ▼
  Room Models  → Heat loss calculations
```

### 2. Design Phase
```
Room Requirements
      │
      ▼
┌─────────────┐
│  Hydraulic  │  Generate pipe layout
│   Solver    │  → Serpentine pattern
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   P-PIPE    │  Calculate pipe length
│   Model     │  → Pressure loss
└──────┬──────┘  → Circuit validation
       │
       ▼
  Critical? → Adjust flow/diameter
```

### 3. Cost Phase
```
Material List
      │
      ▼
┌─────────────┐
│  COST-API   │  Calculate total cost
└──────┬──────┘  → Budget validation
       │
       ▼
  Within Budget? → Optimize materials
```

## Module Details

### L-FLOOR Module
**Purpose**: Define building thermal envelope

**Input**: YAML file with rooms, walls, windows  
**Output**: Structured data with thermal properties

**Key Functions**:
- Parse YAML building definitions
- Apply thermal property defaults
- Calculate room-by-room heat loss
- Support for historical materials

**Formula**:
```
Q_total = Σ(U_wall × A_wall × ΔT) + 
          Σ(ψ × L_bridge × ΔT) +
          Σ(U_window × A_window × ΔT)
```

### P-PIPE Module
**Purpose**: Model hydraulic pipe network

**Input**: Room dimensions, pipe spacing, flow requirements  
**Output**: Pipe geometry and hydraulic characteristics

**Key Functions**:
- Generate serpentine layouts
- Calculate pipe lengths (straight + curved)
- Compute pressure loss (Darcy-Weisbach)
- Detect critical circuits (>300 mbar)

**Formula**:
```
Δp = f × (L/D) × (ρ × v²/2)

Where f from Swamee-Jain:
f = 0.25 / [log₁₀(ε/(3.7D) + 5.74/Re^0.9)]²
```

### COST-API Module
**Purpose**: Manage material costs and budgets

**Input**: Material selections and quantities  
**Output**: Total cost, budget status, efficiency metrics

**Key Functions**:
- Look up material prices
- Calculate line-item costs
- Validate against budget
- Compute cost-per-Kelvin efficiency

**Database**: 2025 material prices (QuickTherm system)

### Hydraulic Solver
**Purpose**: Automated circuit design

**Input**: Circuit design parameters  
**Output**: Complete solution with geometry, hydraulics, costs

**Key Functions**:
- Generate optimal pipe layouts
- Calculate flow requirements
- Validate hydraulic performance
- Estimate material costs
- Assess thermal output

**Algorithm**:
```
1. Calculate required heat output
2. Determine flow rate from Q = ṁ × cp × ΔT
3. Generate serpentine pipe layout
4. Calculate total pipe length
5. Compute pressure loss
6. Validate against critical threshold
7. Calculate material costs
8. Estimate heat output
9. Return complete solution
```

## File Organization

```
Thermal-Craft/
├── src/
│   ├── models/           # Core data models
│   │   ├── LFloor.ts     # Physical environment
│   │   ├── PPipe.ts      # Hydraulic network
│   │   └── CostAPI.ts    # Material pricing
│   ├── parsers/          # Data parsers
│   │   └── LFloorParser.ts
│   ├── solvers/          # Simulation engines
│   │   └── HydraulicSolver.ts
│   ├── index.ts          # Main exports
│   └── demo.ts           # Demo application
├── examples/             # Example scenarios
│   └── waschenbach_house.yaml
├── test/                 # Test suite
│   └── test-suite.ts
├── tsconfig.json         # TypeScript config
├── package.json          # Project metadata
└── README.md            # Documentation
```

## Design Patterns

### 1. Separation of Concerns
- Each DSL is independent
- Solvers orchestrate between DSLs
- No circular dependencies

### 2. Immutable Data
- Models are read-only after creation
- Calculations produce new objects
- No side effects in pure functions

### 3. Functional Composition
- Small, focused functions
- Easy to test and validate
- Composable for complex operations

### 4. Type Safety
- TypeScript for compile-time checks
- Explicit interfaces
- No implicit any types

## Future Architecture (Full Game)

```
┌─────────────────────────────────────────────────────────┐
│                    WEB APPLICATION                      │
├─────────────────────────────────────────────────────────┤
│  React UI Layer                                         │
│  ├── Plan Canvas (PixiJS)    ← User drawing interface  │
│  ├── Heatmap Overlay          ← Real-time visualization│
│  └── Telemetry Dashboard      ← Performance metrics    │
├─────────────────────────────────────────────────────────┤
│  State Management (Redux/XState)                        │
│  ├── Building State           ← L-FLOOR data           │
│  ├── Circuit State            ← P-PIPE data            │
│  └── Budget State             ← COST-API data          │
├─────────────────────────────────────────────────────────┤
│  Computation Layer                                      │
│  ├── Main Thread              ← UI + light calculations│
│  └── Web Worker               ← FEM simulation         │
├─────────────────────────────────────────────────────────┤
│  Core Engine (Current Implementation)                   │
│  ├── L-FLOOR                  ← Thermal modeling       │
│  ├── P-PIPE                   ← Hydraulics             │
│  ├── COST-API                 ← Budget management      │
│  └── Solvers                  ← Optimization           │
└─────────────────────────────────────────────────────────┘
```

## Performance Considerations

### Current Implementation
- Synchronous calculations
- Suitable for single-room analysis
- Fast response times (<10ms typical)

### Future Optimizations
- Web Workers for heavy FEM calculations
- Incremental updates for real-time editing
- Spatial indexing for large buildings
- Cached intermediate results

## Testing Strategy

### Unit Tests
- Individual function validation
- Pure function testing
- Edge case coverage

### Integration Tests
- End-to-end solver workflows
- Multi-room scenarios
- Budget constraint validation

### Performance Tests
- Large building models
- Complex pipe networks
- Real-time update latency

## API Versioning

Current version: 1.0.0

Breaking changes will increment major version.
New features increment minor version.
Bug fixes increment patch version.
