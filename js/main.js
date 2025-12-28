/**
 * Therma-Craft Main Application
 * Game for renovating 1957 floor plans with heating systems
 */

import { LFloorParser } from './lfloor-parser.js';
import { PPipeParser } from './ppipe-parser.js';
import { HeatSimulation } from './heat-simulation.js';
import { CostCalculator } from './cost-calculator.js';
import { CanvasRenderer } from './canvas-renderer.js';

class ThermaCraft {
    constructor() {
        this.floorParser = new LFloorParser();
        this.pipeParser = new PPipeParser();
        this.costCalc = new CostCalculator(15000);
        
        // Canvas setup
        this.canvas = document.getElementById('main-canvas');
        this.renderer = new CanvasRenderer(this.canvas);
        
        // Current data
        this.floorData = null;
        this.pipeData = null;
        this.heatmap = null;
        
        // Drawing state
        this.currentTool = 'select';
        this.isDrawing = false;
        this.startPoint = null;
        this.tempPipes = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadExampleData();
        this.updateUI();
        this.renderer.render(this.floorData, this.pipeData);
    }

    setupEventListeners() {
        // Parse buttons
        document.getElementById('parse-floor').addEventListener('click', () => {
            this.parseFloorDSL();
        });

        document.getElementById('parse-pipe').addEventListener('click', () => {
            this.parsePipeDSL();
        });

        // Simulation button
        document.getElementById('run-simulation').addEventListener('click', () => {
            this.runSimulation();
        });

        // Tool buttons
        document.getElementById('tool-select').addEventListener('click', () => {
            this.setTool('select');
        });
        document.getElementById('tool-pipe').addEventListener('click', () => {
            this.setTool('pipe');
        });
        document.getElementById('tool-wall').addEventListener('click', () => {
            this.setTool('wall');
        });
        document.getElementById('tool-window').addEventListener('click', () => {
            this.setTool('window');
        });
        document.getElementById('clear-canvas').addEventListener('click', () => {
            this.clearCanvas();
        });

        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.onCanvasMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onCanvasMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onCanvasMouseUp(e));
    }

    setTool(tool) {
        this.currentTool = tool;
        
        // Update button states
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`tool-${tool}`).classList.add('active');
    }

    loadExampleData() {
        // Load example L-FLOOR DSL
        const exampleFloor = `# L-FLOOR DSL - 1957 Grundriss
WALL 1 U=1.4 LENGTH=5.0 MATERIAL=HOHLBLOCK
WALL 2 U=1.4 LENGTH=4.0 MATERIAL=HOHLBLOCK
WINDOW 1 U=5.8 AREA=2.0 TYPE=EINFACHGLAS
WINDOW 2 U=5.8 AREA=1.5 TYPE=EINFACHGLAS
ROOM 1 AREA=25.0 TARGET=21.0`;

        document.getElementById('floor-dsl').value = exampleFloor;

        // Load example P-PIPE DSL
        const examplePipe = `# P-PIPE DSL - Fußbodenheizung
PIPE 1 START=(1,2) END=(10,2) RADIUS=0.016
BEND 1 ANGLE=90 RADIUS=0.2 AT=(10,2)
PIPE 2 START=(10,2) END=(10,8) RADIUS=0.016
BEND 2 ANGLE=90 RADIUS=0.2 AT=(10,8)
PIPE 3 START=(10,8) END=(1,8) RADIUS=0.016`;

        document.getElementById('pipe-dsl').value = examplePipe;

        // Parse initial data
        this.parseFloorDSL();
        this.parsePipeDSL();
    }

    parseFloorDSL() {
        const dslText = document.getElementById('floor-dsl').value;
        this.floorData = this.floorParser.parse(dslText);

        if (this.floorData.errors.length > 0) {
            alert('L-FLOOR Parsing Errors:\n' + this.floorData.errors.join('\n'));
        } else {
            console.log('L-FLOOR parsed successfully:', this.floorData);
        }

        this.updateCosts();
        this.renderer.render(this.floorData, this.pipeData, this.heatmap);
    }

    parsePipeDSL() {
        const dslText = document.getElementById('pipe-dsl').value;
        this.pipeData = this.pipeParser.parse(dslText);

        if (this.pipeData.errors.length > 0) {
            alert('P-PIPE Parsing Errors:\n' + this.pipeData.errors.join('\n'));
        } else {
            console.log('P-PIPE parsed successfully:', this.pipeData);
        }

        this.updateCosts();
        this.renderer.render(this.floorData, this.pipeData, this.heatmap);
    }

    runSimulation() {
        if (!this.floorData || !this.pipeData) {
            alert('Bitte zuerst L-FLOOR und P-PIPE parsen!');
            return;
        }

        console.log('Starting simulation...');

        // Create heat simulation
        const sim = new HeatSimulation(10, 10, 0.125);

        // Add heat sources from pipes
        this.pipeData.pipes.forEach(pipe => {
            // Sample points along pipe
            const steps = Math.ceil(pipe.length * 10);
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const x = pipe.start.x + t * (pipe.end.x - pipe.start.x);
                const y = pipe.start.y + t * (pipe.end.y - pipe.start.y);
                
                // Flow temperature (will be calculated)
                sim.addHeatSource(x, y, 35);
            }
        });

        // Run simulation to steady state
        sim.runToSteadyState(500);

        // Get results
        const avgTemp = sim.getAverageTemp();
        const heatLoss = this.floorParser.calculateHeatLoss(-10);
        const pressureLoss = this.pipeParser.calculatePressureLoss();

        // Calculate required flow temperature
        // Q = m * cp * ΔT
        // Simplified: flowTemp = roomTemp + heatLoss / heatTransferCoeff
        const pipeLength = this.pipeParser.getTotalLength();
        const heatTransferCoeff = pipeLength * 10; // W/K (simplified)
        const flowTemp = 21 + (heatLoss / heatTransferCoeff);

        // Update UI
        document.getElementById('flow-temp').textContent = flowTemp.toFixed(1) + ' °C';
        document.getElementById('room-temp').textContent = avgTemp.toFixed(1) + ' °C';
        document.getElementById('pressure-loss').textContent = pressureLoss.toFixed(0) + ' Pa';

        // Check goal: Max 35°C flow at 21°C room temp
        const goalMet = flowTemp <= 35 && avgTemp >= 20.5 && avgTemp <= 21.5;
        const statusEl = document.getElementById('goal-status');
        
        if (goalMet) {
            statusEl.textContent = '✓ Ziel erreicht!';
            statusEl.className = 'success';
        } else {
            statusEl.textContent = '✗ Ziel nicht erreicht';
            statusEl.className = 'failure';
            
            if (flowTemp > 35) {
                statusEl.textContent += ' (Vorlauf zu hoch)';
            }
            if (avgTemp < 20.5) {
                statusEl.textContent += ' (Raum zu kalt)';
            }
        }

        // Store and render heatmap
        this.heatmap = sim.getHeatmap();
        this.renderer.render(this.floorData, this.pipeData, this.heatmap);

        console.log('Simulation complete:', {
            flowTemp,
            avgTemp,
            heatLoss,
            pressureLoss,
            goalMet
        });
    }

    updateCosts() {
        this.costCalc.reset();

        // Calculate pipe costs
        if (this.pipeData && this.pipeData.pipes.length > 0) {
            const totalLength = this.pipeParser.getTotalLength();
            this.costCalc.calculatePipeCost(totalLength, 0.016);
        }

        // Calculate window costs if upgrading
        if (this.floorData && this.floorData.windows.length > 0) {
            const totalWindowArea = this.floorData.windows.reduce((sum, w) => sum + w.area, 0);
            // Assume upgrading to double glazing
            // this.costCalc.calculateWindowCost(totalWindowArea, 'DOPPEL');
        }

        // Add labor (estimate based on pipe length)
        if (this.pipeData) {
            const laborHours = this.pipeParser.getTotalLength() * 0.5; // 0.5h per meter
            this.costCalc.addLaborCost(laborHours);
        }

        this.updateUI();
    }

    updateUI() {
        const breakdown = this.costCalc.getCostBreakdown();
        
        document.getElementById('material-cost').textContent = 
            Math.round(breakdown.total) + ' €';
        
        const remainingEl = document.getElementById('remaining');
        remainingEl.textContent = Math.round(breakdown.remaining) + ' €';
        
        if (breakdown.overBudget) {
            remainingEl.classList.add('negative');
        } else {
            remainingEl.classList.remove('negative');
        }
    }

    onCanvasMouseDown(e) {
        if (this.currentTool === 'pipe') {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const snapped = this.renderer.snapToGrid(x, y);
            this.startPoint = this.renderer.screenToGrid(snapped.x, snapped.y);
            this.isDrawing = true;
        }
    }

    onCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const grid = this.renderer.screenToGrid(x, y);
        document.getElementById('mouse-pos').textContent = 
            `(${grid.x.toFixed(1)}, ${grid.y.toFixed(1)})`;
    }

    onCanvasMouseUp(e) {
        if (this.currentTool === 'pipe' && this.isDrawing) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const snapped = this.renderer.snapToGrid(x, y);
            const endPoint = this.renderer.screenToGrid(snapped.x, snapped.y);

            // Add pipe to DSL
            if (this.startPoint && 
                (Math.abs(endPoint.x - this.startPoint.x) > 0.1 || 
                 Math.abs(endPoint.y - this.startPoint.y) > 0.1)) {
                
                const pipeId = this.pipeData ? this.pipeData.pipes.length + 1 : 1;
                const newPipe = `PIPE ${pipeId} START=(${this.startPoint.x.toFixed(1)},${this.startPoint.y.toFixed(1)}) END=(${endPoint.x.toFixed(1)},${endPoint.y.toFixed(1)}) RADIUS=0.016`;
                
                const currentDSL = document.getElementById('pipe-dsl').value;
                document.getElementById('pipe-dsl').value = currentDSL + '\n' + newPipe;
                
                this.parsePipeDSL();
            }

            this.isDrawing = false;
            this.startPoint = null;
        }
    }

    clearCanvas() {
        if (confirm('Alle Daten löschen?')) {
            document.getElementById('floor-dsl').value = '';
            document.getElementById('pipe-dsl').value = '';
            this.floorData = null;
            this.pipeData = null;
            this.heatmap = null;
            this.costCalc.reset();
            this.updateUI();
            this.renderer.render(null, null, null);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ThermaCraft();
});
