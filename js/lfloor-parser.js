/**
 * L-FLOOR DSL Parser
 * Parses floor layout definitions with walls, windows, and U-values
 */

export class LFloorParser {
    constructor() {
        this.walls = [];
        this.windows = [];
        this.rooms = [];
        this.errors = [];
    }

    /**
     * Parse L-FLOOR DSL text
     * @param {string} dslText - DSL text to parse
     * @returns {Object} Parsed floor layout
     */
    parse(dslText) {
        this.walls = [];
        this.windows = [];
        this.rooms = [];
        this.errors = [];

        const lines = dslText.split('\n');

        lines.forEach((line, lineNum) => {
            line = line.trim();
            
            // Skip comments and empty lines
            if (!line || line.startsWith('#')) {
                return;
            }

            try {
                if (line.startsWith('WALL')) {
                    this.parseWall(line);
                } else if (line.startsWith('WINDOW')) {
                    this.parseWindow(line);
                } else if (line.startsWith('ROOM')) {
                    this.parseRoom(line);
                } else {
                    this.errors.push(`Line ${lineNum + 1}: Unknown command '${line.split(' ')[0]}'`);
                }
            } catch (error) {
                this.errors.push(`Line ${lineNum + 1}: ${error.message}`);
            }
        });

        return {
            walls: this.walls,
            windows: this.windows,
            rooms: this.rooms,
            errors: this.errors,
            isValid: this.errors.length === 0
        };
    }

    /**
     * Parse WALL definition
     * Format: WALL <id> U=<value> LENGTH=<value> [MATERIAL=<type>]
     */
    parseWall(line) {
        const tokens = line.split(/\s+/);
        
        if (tokens.length < 4) {
            throw new Error('WALL requires: id, U-value, and LENGTH');
        }

        const wall = {
            type: 'wall',
            id: parseInt(tokens[1]),
            uValue: this.extractValue(line, 'U'),
            length: this.extractValue(line, 'LENGTH'),
            material: this.extractStringValue(line, 'MATERIAL') || 'STANDARD'
        };

        // Validate
        if (isNaN(wall.id)) {
            throw new Error('Invalid wall ID');
        }
        if (wall.uValue <= 0) {
            throw new Error('U-value must be positive');
        }
        if (wall.length <= 0) {
            throw new Error('LENGTH must be positive');
        }

        this.walls.push(wall);
    }

    /**
     * Parse WINDOW definition
     * Format: WINDOW <id> U=<value> AREA=<value> [TYPE=<type>]
     */
    parseWindow(line) {
        const tokens = line.split(/\s+/);
        
        if (tokens.length < 4) {
            throw new Error('WINDOW requires: id, U-value, and AREA');
        }

        const window = {
            type: 'window',
            id: parseInt(tokens[1]),
            uValue: this.extractValue(line, 'U'),
            area: this.extractValue(line, 'AREA'),
            windowType: this.extractStringValue(line, 'TYPE') || 'EINFACHGLAS'
        };

        // Validate
        if (isNaN(window.id)) {
            throw new Error('Invalid window ID');
        }
        if (window.uValue <= 0) {
            throw new Error('U-value must be positive');
        }
        if (window.area <= 0) {
            throw new Error('AREA must be positive');
        }

        this.windows.push(window);
    }

    /**
     * Parse ROOM definition
     * Format: ROOM <id> AREA=<value> TARGET=<temp>
     */
    parseRoom(line) {
        const tokens = line.split(/\s+/);
        
        if (tokens.length < 4) {
            throw new Error('ROOM requires: id, AREA, and TARGET temperature');
        }

        const room = {
            type: 'room',
            id: parseInt(tokens[1]),
            area: this.extractValue(line, 'AREA'),
            targetTemp: this.extractValue(line, 'TARGET')
        };

        // Validate
        if (isNaN(room.id)) {
            throw new Error('Invalid room ID');
        }
        if (room.area <= 0) {
            throw new Error('AREA must be positive');
        }
        if (room.targetTemp < 10 || room.targetTemp > 30) {
            throw new Error('TARGET temperature must be between 10-30°C');
        }

        this.rooms.push(room);
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
     * Extract string value from parameter
     */
    extractStringValue(line, param) {
        const regex = new RegExp(`${param}=([A-Z0-9_]+)`, 'i');
        const match = line.match(regex);
        return match ? match[1] : null;
    }

    /**
     * Calculate total heat loss from parsed floor layout
     */
    calculateHeatLoss(outsideTemp = -10) {
        let totalLoss = 0;

        this.walls.forEach(wall => {
            // Heat loss = U * A * ΔT
            const area = wall.length * 2.5; // Assume 2.5m height
            const deltaT = 21 - outsideTemp;
            totalLoss += wall.uValue * area * deltaT;
        });

        this.windows.forEach(window => {
            const deltaT = 21 - outsideTemp;
            totalLoss += window.uValue * window.area * deltaT;
        });

        return totalLoss; // in Watts
    }
}
