/**
 * Canvas Renderer
 * Handles grid-based drawing and visualization
 */

export class CanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = 50; // pixels per 12.5cm
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.pipes = [];
        this.walls = [];
        this.windows = [];
        this.heatmap = null;
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draw grid
     */
    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Draw thicker lines every 4 cells (50cm)
        this.ctx.strokeStyle = '#bdbdbd';
        this.ctx.lineWidth = 2;
        
        for (let x = 0; x <= this.canvas.width; x += this.gridSize * 4) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += this.gridSize * 4) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * Draw heatmap
     */
    drawHeatmap(heatmap) {
        if (!heatmap || heatmap.length === 0) return;

        const rows = heatmap.length;
        const cols = heatmap[0].length;
        const cellWidth = this.canvas.width / cols;
        const cellHeight = this.canvas.height / rows;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const temp = heatmap[i][j];
                const color = this.tempToColor(temp);
                
                this.ctx.fillStyle = color;
                this.ctx.fillRect(
                    j * cellWidth,
                    i * cellHeight,
                    cellWidth,
                    cellHeight
                );
            }
        }
    }

    /**
     * Convert temperature to color (blue -> green -> yellow -> red)
     */
    tempToColor(temp) {
        // Map temperature range 10-40°C to color
        const minTemp = 10;
        const maxTemp = 40;
        const t = Math.max(0, Math.min(1, (temp - minTemp) / (maxTemp - minTemp)));
        
        let r, g, b;
        
        if (t < 0.25) {
            // Blue to cyan
            const t2 = t / 0.25;
            r = 0;
            g = Math.floor(t2 * 255);
            b = 255;
        } else if (t < 0.5) {
            // Cyan to green
            const t2 = (t - 0.25) / 0.25;
            r = 0;
            g = 255;
            b = Math.floor((1 - t2) * 255);
        } else if (t < 0.75) {
            // Green to yellow
            const t2 = (t - 0.5) / 0.25;
            r = Math.floor(t2 * 255);
            g = 255;
            b = 0;
        } else {
            // Yellow to red
            const t2 = (t - 0.75) / 0.25;
            r = 255;
            g = Math.floor((1 - t2) * 255);
            b = 0;
        }
        
        return `rgba(${r}, ${g}, ${b}, 0.6)`;
    }

    /**
     * Draw pipes
     */
    drawPipes(pipes) {
        this.ctx.strokeStyle = '#2196F3';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';

        pipes.forEach(pipe => {
            const x1 = pipe.start.x * this.gridSize;
            const y1 = pipe.start.y * this.gridSize;
            const x2 = pipe.end.x * this.gridSize;
            const y2 = pipe.end.y * this.gridSize;

            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();

            // Draw endpoints
            this.ctx.fillStyle = '#1976D2';
            this.ctx.beginPath();
            this.ctx.arc(x1, y1, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(x2, y2, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    /**
     * Draw bends
     */
    drawBends(bends) {
        this.ctx.strokeStyle = '#FF9800';
        this.ctx.lineWidth = 4;

        bends.forEach(bend => {
            const x = bend.at.x * this.gridSize;
            const y = bend.at.y * this.gridSize;
            const radius = bend.radius * this.gridSize;

            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, (bend.angle * Math.PI) / 180);
            this.ctx.stroke();

            // Draw center point
            this.ctx.fillStyle = '#F57C00';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 6, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    /**
     * Draw walls
     */
    drawWalls(walls) {
        this.ctx.strokeStyle = '#424242';
        this.ctx.lineWidth = 8;
        this.ctx.lineCap = 'square';

        walls.forEach(wall => {
            const x = wall.id * this.gridSize;
            const y = 50;
            const length = wall.length * this.gridSize;

            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + length, y);
            this.ctx.stroke();

            // Label
            this.ctx.fillStyle = '#424242';
            this.ctx.font = '12px sans-serif';
            this.ctx.fillText(`U=${wall.uValue}`, x + 5, y - 5);
        });
    }

    /**
     * Draw windows
     */
    drawWindows(windows) {
        this.ctx.strokeStyle = '#03A9F4';
        this.ctx.fillStyle = 'rgba(3, 169, 244, 0.2)';
        this.ctx.lineWidth = 3;

        windows.forEach(window => {
            const x = window.id * this.gridSize;
            const y = 100;
            const width = Math.sqrt(window.area) * this.gridSize;
            const height = width;

            this.ctx.fillRect(x, y, width, height);
            this.ctx.strokeRect(x, y, width, height);

            // Label
            this.ctx.fillStyle = '#01579B';
            this.ctx.font = '12px sans-serif';
            this.ctx.fillText(`${window.windowType} U=${window.uValue}`, x + 5, y + 15);
        });
    }

    /**
     * Snap coordinate to grid
     */
    snapToGrid(x, y) {
        return {
            x: Math.round(x / this.gridSize) * this.gridSize,
            y: Math.round(y / this.gridSize) * this.gridSize
        };
    }

    /**
     * Convert screen coordinates to grid coordinates
     */
    screenToGrid(x, y) {
        return {
            x: x / this.gridSize,
            y: y / this.gridSize
        };
    }

    /**
     * Render all
     */
    render(floorData, pipeData, heatmap = null) {
        this.clear();
        
        if (heatmap) {
            this.drawHeatmap(heatmap);
        }
        
        this.drawGrid();
        
        if (floorData) {
            if (floorData.walls) this.drawWalls(floorData.walls);
            if (floorData.windows) this.drawWindows(floorData.windows);
        }
        
        if (pipeData) {
            if (pipeData.pipes) this.drawPipes(pipeData.pipes);
            if (pipeData.bends) this.drawBends(pipeData.bends);
        }
    }
}
