/**
 * COST-API: Material Pricing Interface
 * JSON-based interface for material costs (2025 prices)
 */

export interface MaterialPrice {
  /** Material identifier */
  id: string;
  /** Material name */
  name: string;
  /** Unit of measurement */
  unit: string;
  /** Price per unit in EUR */
  price_per_unit: number;
  /** Description */
  description?: string;
}

export interface CostDatabase {
  /** Last update date */
  last_updated: string;
  /** Currency */
  currency: string;
  /** Material prices */
  materials: MaterialPrice[];
}

/**
 * Standard material prices for 2025
 */
export const MATERIAL_COSTS_2025: CostDatabase = {
  last_updated: '2025-01-01',
  currency: 'EUR',
  materials: [
    {
      id: 'pipe_16mm',
      name: 'PE-Xa Rohr 16mm (QuickTherm)',
      unit: 'meter',
      price_per_unit: 4.5,
      description: 'Crosslinked polyethylene pipe for underfloor heating',
    },
    {
      id: 'pipe_20mm',
      name: 'PE-Xa Rohr 20mm (QuickTherm)',
      unit: 'meter',
      price_per_unit: 5.8,
      description: 'Larger diameter pipe for main distribution',
    },
    {
      id: 'eps_plate_30mm',
      name: 'EPS-Dämmplatte 30mm',
      unit: 'm²',
      price_per_unit: 8.5,
      description: 'Expanded polystyrene insulation plate',
    },
    {
      id: 'eps_plate_50mm',
      name: 'EPS-Dämmplatte 50mm',
      unit: 'm²',
      price_per_unit: 12.0,
      description: 'Thicker EPS insulation for better performance',
    },
    {
      id: 'alu_sheet',
      name: 'Alu-Verteilerblech',
      unit: 'm²',
      price_per_unit: 18.0,
      description: 'Aluminum heat distribution plate',
    },
    {
      id: 'window_single',
      name: 'Fenster einfach verglast',
      unit: 'm²',
      price_per_unit: 150.0,
      description: 'Single glazed window (1-fach)',
    },
    {
      id: 'window_double',
      name: 'Fenster zweifach verglast',
      unit: 'm²',
      price_per_unit: 280.0,
      description: 'Double glazed window (2-fach)',
    },
    {
      id: 'window_triple',
      name: 'Fenster dreifach verglast',
      unit: 'm²',
      price_per_unit: 450.0,
      description: 'Triple glazed window (3-fach)',
    },
    {
      id: 'manifold',
      name: 'Heizkreisverteiler',
      unit: 'piece',
      price_per_unit: 350.0,
      description: 'Heating circuit manifold with flow meters',
    },
    {
      id: 'pump',
      name: 'Hocheffizienzpumpe',
      unit: 'piece',
      price_per_unit: 420.0,
      description: 'High-efficiency circulation pump',
    },
    {
      id: 'thermostat',
      name: 'Raumthermostat',
      unit: 'piece',
      price_per_unit: 85.0,
      description: 'Room thermostat',
    },
  ],
};

export interface BudgetItem {
  material_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Budget {
  /** Total available budget in EUR */
  total_budget: number;
  /** Items to purchase */
  items: BudgetItem[];
  /** Total spent */
  total_spent: number;
  /** Remaining budget */
  remaining_budget: number;
}

/**
 * Get material price by ID
 * @param materialId Material identifier
 * @returns Material price or undefined if not found
 */
export function getMaterialPrice(materialId: string): MaterialPrice | undefined {
  return MATERIAL_COSTS_2025.materials.find((m) => m.id === materialId);
}

/**
 * Calculate budget for a list of items
 * @param totalBudget Total available budget in EUR
 * @param items List of budget items with material_id and quantity
 * @returns Budget object with calculations
 */
export function calculateBudget(
  totalBudget: number,
  items: Array<{ material_id: string; quantity: number }>
): Budget {
  const budgetItems: BudgetItem[] = [];
  let totalSpent = 0;

  for (const item of items) {
    const material = getMaterialPrice(item.material_id);
    if (material) {
      const itemTotal = material.price_per_unit * item.quantity;
      budgetItems.push({
        material_id: item.material_id,
        quantity: item.quantity,
        unit_price: material.price_per_unit,
        total_price: itemTotal,
      });
      totalSpent += itemTotal;
    }
  }

  return {
    total_budget: totalBudget,
    items: budgetItems,
    total_spent: totalSpent,
    remaining_budget: totalBudget - totalSpent,
  };
}

/**
 * Check if budget allows for the purchases
 * @param budget Budget to check
 * @returns True if within budget
 */
export function isWithinBudget(budget: Budget): boolean {
  return budget.remaining_budget >= 0;
}

/**
 * Calculate cost per Kelvin of heating improvement
 * @param totalCost Total cost in EUR
 * @param temperatureImprovement Temperature increase achieved in Kelvin
 * @returns Cost per Kelvin
 */
export function calculateCostPerKelvin(
  totalCost: number,
  temperatureImprovement: number
): number {
  if (temperatureImprovement === 0) return Infinity;
  return totalCost / temperatureImprovement;
}
