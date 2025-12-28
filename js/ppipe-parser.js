/**
 * P-PIPE DSL Parser
 * Parses pipe routing with vector graphics and bending radii
 */

export class PPipeParser {
    constructor() {
        this.pipes = [];
        this.bends = [];
        this.errors = [];
    }

    /**
     * Parse P-PIPE DSL text
     * @param {string} dslText - DSL text to parse
     * @returns {Object} Parsed pipe layout
     */
    parse(dslText) {
        this.pipes = [];
        this.bends = [];
        this.errors = [];

        const lines = dslText.split('\n');

        lines.forEach((line, lineNum) => {
            line = line.trim();
            
            // Skip comments and empty lines
            if (!line || line.startsWith('#')) {
                return;
            }

            try {
                if (line.startsWith('PIPE')) {
                    this.parsePipe(line);
                } else if (line.startsWith('BEND')) {
                    this.parseBend(line);
                } else {
                    this.errors.push(`Line ${lineNum + 1}: Unknown command '${line.split(' ')[0]}'`);
                }
            } catch (error) {
                this.errors.push(`Line ${lineNum + 1}: ${error.message}`);
            }
        });

        return {
            pipes: this.pipes,
            bends: this.bends,
            errors: this.errors,
            isValid: this.errors.length === 0
        };
    }

    /**
     * Parse PIPE definition
     * Format: PIPE <id> START=(x,y) END=(x,y) RADIUS=<value>
     */
    parsePipe(line) {
        const tokens = line.split(/\s+/);
        
        if (tokens.length < 5) {
            throw new Error('PIPE requires: id, START, END, and RADIUS');
        }

        const pipe = {
            type: 'pipe',
            id: parseInt(tokens[1]),
            start: this.extractPoint(line, 'START'),
            end: this.extractPoint(line, 'END'),
            radius: this.extractValue(line, 'RADIUS')
        };

        // Validate
        if (isNaN(pipe.id)) {
            throw new Error('Invalid pipe ID');
        }
        if (!pipe.start || !pipe.end) {
            throw new Error('Invalid START or END coordinates');
        }
        if (pipe.radius <= 0) {
            throw new Error('RADIUS must be positive');
        }

        // Calculate length
        pipe.length = Math.sqrt(
            Math.pow(pipe.end.x - pipe.start.x, 2) + 
            Math.pow(pipe.end.y - pipe.start.y, 2)
        );

        this.pipes.push(pipe);
    }

    /**
     * Parse BEND definition
     * Format: BEND <id> ANGLE=<degrees> RADIUS=<value> AT=(x,y)
     */
    parseBend(line) {
        const tokens = line.split(/\s+/);
        
        if (tokens.length < 5) {
            throw new Error('BEND requires: id, ANGLE, RADIUS, and AT position');
        }

        const bend = {
            type: 'bend',
            id: parseInt(tokens[1]),
            angle: this.extractValue(line, 'ANGLE'),
            radius: this.extractValue(line, 'RADIUS'),
            at: this.extractPoint(line, 'AT')
        };

        // Validate
        if (isNaN(bend.id)) {
            throw new Error('Invalid bend ID');
        }
        if (bend.angle <= 0 || bend.angle > 180) {
            throw new Error('ANGLE must be between 0-180 degrees');
        }
        if (bend.radius <= 0) {
            throw new Error('RADIUS must be positive');
        }
        if (!bend.at) {
            throw new Error('Invalid AT coordinates');
        }

        this.bends.push(bend);
    }

    /**
     * Extract point coordinates (x,y)
     */
    extractPoint(line, param) {
        const regex = new RegExp(`${param}=\\(([0-9.-]+),([0-9.-]+)\\)`, 'i');
        const match = line.match(regex);
        if (!match) {
            return null;
        }
        return {
            x: parseFloat(match[1]),
            y: parseFloat(match[2])
        };
    }

    /**
     * Extract numeric value from parameter
     */
    extractValue(line, param) {
        const regex = new RegExp(`${param}=([0-9.]+)`, 'i');
        const match = line.match(regex);
        if (!match) {
            throw new Error(`Missing parameter: ${param}`);
        }
        return parseFloat(match[1]);
    }

    /**
     * Calculate total pipe length
     */
    getTotalLength() {
        let total = 0;
        this.pipes.forEach(pipe => {
            total += pipe.length;
        });
        return total;
    }

    /**
     * Calculate pressure loss (simplified Darcy-Weisbach)
     * ΔP = f * (L/D) * (ρ * v²/2)
     */
    calculatePressureLoss(flowRate = 0.5, density = 1000) {
        let totalLoss = 0;
        const friction = 0.02; // Friction factor for smooth pipes

        this.pipes.forEach(pipe => {
            // Velocity = Flow rate / Cross-sectional area
            const area = Math.PI * Math.pow(pipe.radius, 2);
            const velocity = flowRate / area;
            
            // Darcy-Weisbach equation
            const diameter = pipe.radius * 2;
            const loss = friction * (pipe.length / diameter) * (density * Math.pow(velocity, 2) / 2);
            totalLoss += loss;
        });

        // Add bend losses (K-factor method)
        const BEND_K_FACTOR_BASE = 0.5; // Base K-factor for bends
        const REFERENCE_ANGLE = 90; // Reference angle for K-factor calculation
        
        this.bends.forEach(bend => {
            // K-factor approximation based on angle
            const kFactor = BEND_K_FACTOR_BASE * (bend.angle / REFERENCE_ANGLE);
            const area = Math.PI * Math.pow(0.016, 2); // Assume standard radius
            const velocity = flowRate / area;
            const loss = kFactor * (density * Math.pow(velocity, 2) / 2);
            totalLoss += loss;
        });

        return totalLoss; // in Pascals
    }

    /**
     * Get vector graphics representation for rendering
     */
    toVectorGraphics() {
        const paths = [];

        this.pipes.forEach(pipe => {
            paths.push({
                type: 'line',
                x1: pipe.start.x,
                y1: pipe.start.y,
                x2: pipe.end.x,
                y2: pipe.end.y,
                stroke: '#2196F3',
                strokeWidth: 3
            });
        });

        this.bends.forEach(bend => {
            paths.push({
                type: 'arc',
                cx: bend.at.x,
                cy: bend.at.y,
                radius: bend.radius,
                angle: bend.angle,
                stroke: '#FF9800',
                strokeWidth: 3
            });
        });

        return paths;
    }
}
