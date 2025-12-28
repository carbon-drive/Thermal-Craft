/**
 * Finite Element Method (FEM) Heat Simulation
 * Simplified 2D heat distribution for floor heating
 */

export class HeatSimulation {
    constructor(width, height, gridSize = 0.125) {
        this.width = width; // meters
        this.height = height; // meters
        this.gridSize = gridSize; // 12.5cm = 0.125m
        
        // Create grid
        this.cols = Math.ceil(width / gridSize);
        this.rows = Math.ceil(height / gridSize);
        
        // Temperature grid
        this.temp = Array(this.rows).fill(0).map(() => Array(this.cols).fill(20));
        this.tempNext = Array(this.rows).fill(0).map(() => Array(this.cols).fill(20));
        
        // Material properties
        this.heatSources = [];
        this.walls = [];
        this.outsideTemp = -10; // °C
    }

    /**
     * Add heat source (pipe segment)
     */
    addHeatSource(x, y, temperature) {
        const col = Math.floor(x / this.gridSize);
        const row = Math.floor(y / this.gridSize);
        
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.heatSources.push({ row, col, temperature });
        }
    }

    /**
     * Add wall boundary
     */
    addWall(x1, y1, x2, y2, uValue) {
        this.walls.push({ x1, y1, x2, y2, uValue });
    }

    /**
     * Run simulation step (explicit finite difference)
     */
    step(deltaTime = 1.0) {
        const alpha = 0.0001; // Thermal diffusivity of concrete (m²/s)
        const dx = this.gridSize;
        const dt = deltaTime;
        
        // Stability criterion (CFL condition)
        const r = alpha * dt / (dx * dx);
        if (r > 0.25) {
            console.warn('Simulation may be unstable. Consider smaller time step.');
        }

        // Apply heat sources
        this.heatSources.forEach(source => {
            if (source.row >= 0 && source.row < this.rows && 
                source.col >= 0 && source.col < this.cols) {
                this.temp[source.row][source.col] = source.temperature;
            }
        });

        // Heat diffusion using finite difference
        for (let i = 1; i < this.rows - 1; i++) {
            for (let j = 1; j < this.cols - 1; j++) {
                // 5-point stencil
                const laplacian = (
                    this.temp[i-1][j] + 
                    this.temp[i+1][j] + 
                    this.temp[i][j-1] + 
                    this.temp[i][j+1] - 
                    4 * this.temp[i][j]
                );
                
                this.tempNext[i][j] = this.temp[i][j] + r * laplacian;
            }
        }

        // Boundary conditions (walls lose heat)
        for (let j = 0; j < this.cols; j++) {
            this.tempNext[0][j] = this.applyBoundary(this.temp[0][j]);
            this.tempNext[this.rows-1][j] = this.applyBoundary(this.temp[this.rows-1][j]);
        }
        for (let i = 0; i < this.rows; i++) {
            this.tempNext[i][0] = this.applyBoundary(this.temp[i][0]);
            this.tempNext[i][this.cols-1] = this.applyBoundary(this.temp[i][this.cols-1]);
        }

        // Swap buffers
        [this.temp, this.tempNext] = [this.tempNext, this.temp];
    }

    /**
     * Apply boundary heat loss
     */
    applyBoundary(temp) {
        const uValue = 1.4; // W/(m²·K) for 1957 walls
        const heatLoss = uValue * (temp - this.outsideTemp) * 0.01;
        return temp - heatLoss;
    }

    /**
     * Run multiple steps to reach steady state
     */
    runToSteadyState(maxSteps = 1000) {
        for (let i = 0; i < maxSteps; i++) {
            this.step();
            
            // Check convergence every 100 steps
            if (i % 100 === 0) {
                const maxChange = this.getMaxChange();
                if (maxChange < 0.01) {
                    console.log(`Converged after ${i} steps`);
                    break;
                }
            }
        }
    }

    /**
     * Get maximum temperature change between steps
     */
    getMaxChange() {
        let maxChange = 0;
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const change = Math.abs(this.temp[i][j] - this.tempNext[i][j]);
                maxChange = Math.max(maxChange, change);
            }
        }
        return maxChange;
    }

    /**
     * Get average room temperature
     */
    getAverageTemp() {
        let sum = 0;
        let count = 0;
        
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                sum += this.temp[i][j];
                count++;
            }
        }
        
        return sum / count;
    }

    /**
     * Get temperature at specific point
     */
    getTempAt(x, y) {
        const col = Math.floor(x / this.gridSize);
        const row = Math.floor(y / this.gridSize);
        
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.temp[row][col];
        }
        return 20;
    }

    /**
     * Get heatmap data for visualization
     */
    getHeatmap() {
        return this.temp.map(row => [...row]);
    }
}
