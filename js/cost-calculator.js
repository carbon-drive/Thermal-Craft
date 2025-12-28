/**
 * Cost Calculator
 * Tracks renovation budget and material costs
 */

export class CostCalculator {
    constructor(budget = 15000) {
        this.budget = budget;
        this.costs = {
            pipes: 0,
            insulation: 0,
            windows: 0,
            labor: 0,
            misc: 0
        };
    }

    /**
     * Calculate pipe installation cost
     * @param {number} length - Total pipe length in meters
     * @param {number} radius - Pipe radius in meters
     */
    calculatePipeCost(length, radius) {
        // Cost factors:
        // - Material: €25/m for DN16 pipe
        // - Installation: €35/m
        const diameter = radius * 2000; // Convert to mm
        const materialCostPerMeter = 20 + (diameter / 16) * 5;
        const installationCostPerMeter = 35;
        
        this.costs.pipes = length * (materialCostPerMeter + installationCostPerMeter);
        return this.costs.pipes;
    }

    /**
     * Calculate insulation cost
     */
    calculateInsulationCost(area, thickness = 0.1) {
        // €40/m² for 10cm insulation
        const costPerSqm = 40 * (thickness / 0.1);
        this.costs.insulation = area * costPerSqm;
        return this.costs.insulation;
    }

    /**
     * Calculate window replacement cost
     */
    calculateWindowCost(area, glazingType = 'DOPPEL') {
        // Single glazing: €0 (existing)
        // Double glazing: €350/m²
        // Triple glazing: €500/m²
        const costs = {
            'EINFACHGLAS': 0,
            'DOPPEL': 350,
            'DREIFACH': 500
        };
        
        this.costs.windows = area * (costs[glazingType] || 350);
        return this.costs.windows;
    }

    /**
     * Add labor cost
     */
    addLaborCost(hours, rate = 65) {
        this.costs.labor = hours * rate;
        return this.costs.labor;
    }

    /**
     * Add miscellaneous cost
     */
    addMiscCost(amount) {
        this.costs.misc += amount;
        return this.costs.misc;
    }

    /**
     * Get total cost
     */
    getTotalCost() {
        return Object.values(this.costs).reduce((sum, cost) => sum + cost, 0);
    }

    /**
     * Get remaining budget
     */
    getRemainingBudget() {
        return this.budget - this.getTotalCost();
    }

    /**
     * Check if over budget
     */
    isOverBudget() {
        return this.getTotalCost() > this.budget;
    }

    /**
     * Get cost breakdown
     */
    getCostBreakdown() {
        return {
            ...this.costs,
            total: this.getTotalCost(),
            remaining: this.getRemainingBudget(),
            overBudget: this.isOverBudget()
        };
    }

    /**
     * Reset all costs
     */
    reset() {
        this.costs = {
            pipes: 0,
            insulation: 0,
            windows: 0,
            labor: 0,
            misc: 0
        };
    }
}
