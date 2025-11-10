/**
 * JSON to Single Line Diagram Converter for Electrical Engineering
 * Converts electrical system JSON data to SVG-based single line diagrams
 */

const fs = require('fs').promises;
const path = require('path');

class SLDConverter {
  constructor(options = {}) {
    this.options = {
      width: options.width || 1200,
      height: options.height || 800,
      margin: options.margin || 50,
      componentSpacing: options.componentSpacing || 100,
      lineThickness: options.lineThickness || 2,
      fontSize: options.fontSize || 12,
      ...options
    };
    
    this.symbols = this.initializeSymbols();
  }

  /**
   * Initialize electrical symbols and their SVG representations
   */
  initializeSymbols() {
    return {
      inverter: {
        width: 80,
        height: 50,
        svg: `<rect x="0" y="0" width="80" height="50" fill="white" stroke="black" stroke-width="2" rx="5"/>
              <text x="40" y="20" text-anchor="middle" font-size="10" font-weight="bold">INVERTER</text>
              <text x="40" y="35" text-anchor="middle" font-size="8">AC/DC</text>`
      },
      isolator: {
        width: 40,
        height: 40,
        svg: `<rect x="0" y="0" width="40" height="40" fill="white" stroke="black" stroke-width="2"/>
              <circle cx="20" cy="20" r="8" fill="none" stroke="black" stroke-width="2"/>
              <line x1="12" y1="20" x2="28" y2="20" stroke="black" stroke-width="2"/>
              <text x="20" y="35" text-anchor="middle" font-size="8">DC ISO</text>`
      },
      pvString: {
        width: 60,
        height: 40,
        svg: `<rect x="0" y="0" width="60" height="40" fill="lightblue" stroke="black" stroke-width="2"/>
              <text x="30" y="15" text-anchor="middle" font-size="8" font-weight="bold">PV STRING</text>
              <text x="30" y="28" text-anchor="middle" font-size="7">Panels</text>`
      },
      connection: {
        svg: `<line x1="0" y1="0" x2="100" y2="0" stroke="black" stroke-width="2"/>`
      }
    };
  }

  /**
   * Generate components and connections from JSON data
   * @param {Object} jsonData - The electrical system JSON data
   * @returns {Object} Components and connections data
   */
  generateLayout(jsonData) {
    const components = [];
    const connections = [];

    // Horizontal layout (inverter → isolators → PV strings)
    const inverterX = this.options.margin;
    const isolatorX = inverterX + 180;
    const pvStartX = isolatorX + 150;
    const pvStringSpacing = 80;
    const isolatorVerticalSpacing = 80;
    const stringVerticalSpacing = 70;
    const betweenInvertersSpacing = 200;

    // Layout each inverter block vertically
    let currentY = this.options.margin + 120;
    let layoutTop = Infinity;
    let layoutBottom = -Infinity;

    for (let i = 0; i < jsonData.inverters.length; i++) {
      const inverter = jsonData.inverters[i];

      // Calculate the vertical height consumed by this inverter block
      let blockHeight = 0;
      for (let j = 0; j < inverter.isolators.length; j++) {
        const isolator = inverter.isolators[j];
        const numStrings = isolator.pvstrings.length || 1;
        blockHeight += (numStrings * stringVerticalSpacing) + isolatorVerticalSpacing;
      }
      blockHeight = Math.max(blockHeight, 140);

      const inverterCenterY = currentY + (blockHeight / 2);
      const inverterTopY = inverterCenterY - (this.symbols.inverter.height / 2);

      // Inverter
      const inverterComponent = {
        id: `inverter_${i}`,
        type: 'inverter',
        x: inverterX,
        y: inverterTopY,
        label: `Inverter ${i + 1}`
      };
      components.push(inverterComponent);

      // Isolators and PV strings for this inverter
      let isolatorY = inverterCenterY - (blockHeight / 2);
      for (let j = 0; j < inverter.isolators.length; j++) {
        const isolator = inverter.isolators[j];

        const isolatorComponent = {
          id: `isolator_${i}_${j}`,
          type: 'isolator',
          x: isolatorX,
          y: isolatorY,
          label: `Isolator ${i + 1}-${j + 1}`
        };
        components.push(isolatorComponent);

        // Inverter → Isolator (positive daisy-chain)
        connections.push({
          from: `inverter_${i}`,
          to: `isolator_${i}_${j}`,
          type: 'daisy_positive'
        });
        
        // Isolator → Inverter (negative return)
        connections.push({
          from: `isolator_${i}_${j}`,
          to: `inverter_${i}`,
          type: 'daisy_negative_return'
        });

        // Generate panels for each string in a simple horizontal layout
        const pvSymbol = this.symbols.pvString;
        let stringYoffset = 0;
        let maxPanelRight = 0;

        for (let s = 0; s < isolator.pvstrings.length; s++) {
          const pvString = isolator.pvstrings[s];
          const stringLength = pvString.length;
          const model = pvString.model;

          const panelsInString = [];
          const stringY = isolatorY + stringYoffset;

          for (let p = 0; p < stringLength; p++) {
          const pvComponent = {
              id: `pv_${i}_${j}_${s}_${p}`,
            type: 'pvString',
              x: pvStartX + (p * pvStringSpacing),
              y: stringY,
              label: p === 0 ? `${model} (${stringLength} panels)` : ''
          };
          components.push(pvComponent);
            panelsInString.push(pvComponent);
            maxPanelRight = Math.max(maxPanelRight, pvComponent.x + pvSymbol.width);
          }

          if (panelsInString.length > 0) {
            // Positive daisy-chain from isolator through all panels
            connections.push({ from: `isolator_${i}_${j}`, to: panelsInString[0].id, type: 'daisy_positive' });
            for (let p = 0; p < panelsInString.length - 1; p++) {
              connections.push({ from: panelsInString[p].id, to: panelsInString[p + 1].id, type: 'daisy_positive' });
            }
            // Negative return from last panel directly back to isolator
            connections.push({ from: panelsInString[panelsInString.length - 1].id, to: `isolator_${i}_${j}`, type: 'daisy_negative_return' });
          }

          stringYoffset += stringVerticalSpacing;
        }
        
        isolatorY += stringYoffset + isolatorVerticalSpacing;
      }

      // Track overall vertical extent for busbar sizing
      layoutTop = Math.min(layoutTop, inverterCenterY - (blockHeight / 2));
      layoutBottom = Math.max(layoutBottom, inverterCenterY + (blockHeight / 2));

      currentY += blockHeight + betweenInvertersSpacing;
    }

    // Expand canvas to fit content
    let maxRight = 0;
    let maxBottom = 0;
    components.forEach(c => {
      const symbol = this.symbols[c.type];
      const width = symbol.width;
      const height = symbol.height;
      maxRight = Math.max(maxRight, c.x + width);
      maxBottom = Math.max(maxBottom, c.y + height);
    });

    const width = Math.max(this.options.width, maxRight + this.options.margin + 80);
    const height = Math.max(this.options.height, maxBottom + this.options.margin + 120);

    return { components, connections, width, height };
  }

  /**
   * Convert JSON data to HTML Canvas
   * @param {Object} jsonData - The electrical system JSON data
   * @param {Object} options - Canvas generation options
   * @returns {string} HTML content with canvas
   */
  async convertToCanvas(jsonData, options = {}) {
    // Generate layout
    const { components, connections, width: canvasWidth, height: canvasHeight } = this.generateLayout(jsonData);

    const title = options.title || 'Single Line Diagram';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: inline-block;
        }
        canvas {
            border: 1px solid #ddd;
            background-color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <canvas id="diagram" width="${canvasWidth}" height="${canvasHeight}"></canvas>
    </div>
    <script>
        const canvas = document.getElementById('diagram');
        const ctx = canvas.getContext('2d');
        
        const components = ${JSON.stringify(components)};
        const connections = ${JSON.stringify(connections)};
        const symbols = ${JSON.stringify(this.symbols)};
        
        const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
        
        const inverterIsolatorMap = {};
        const isolatorSlotLookup = {};
        
        components.forEach(comp => {
            if (comp.type === 'isolator') {
                const inverterIndex = comp.id.split('_')[1];
                if (!inverterIsolatorMap[inverterIndex]) {
                    inverterIsolatorMap[inverterIndex] = [];
                }
                inverterIsolatorMap[inverterIndex].push(comp);
            }
        });
        
        Object.entries(inverterIsolatorMap).forEach(([invIndex, isolators]) => {
            isolators.sort((a, b) => a.y - b.y);
            isolators.forEach((iso, slotIndex) => {
                isolatorSlotLookup[iso.id] = {
                    inverterIndex: invIndex,
                    slotIndex,
                    totalSlots: isolators.length
                };
            });
        });
        
        const getInverterConnectionY = (inverterComp, slotInfo, polarity) => {
            const symbol = symbols[inverterComp.type];
            const inverterHeight = symbol.height;
            const margin = 10;
            const totalSlots = Math.max(1, slotInfo.totalSlots || 1);
            const totalConnections = totalSlots * 2;
            const connectionIndex =
                (slotInfo.slotIndex || 0) * 2 + (polarity === 'positive' ? 0 : 1);
            if (totalConnections <= 1) {
                return inverterComp.y + inverterHeight / 2;
            }
            const availableHeight = Math.max(0, inverterHeight - margin * 2);
            const step =
                totalConnections > 1 ? availableHeight / (totalConnections - 1) : 0;
            return clamp(
                inverterComp.y + margin + step * connectionIndex,
                inverterComp.y + 4,
                inverterComp.y + inverterHeight - 4
            );
        };
        
        // Draw white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw connections first
        connections.forEach(conn => {
            const fromComp = components.find(c => c.id === conn.from);
            const toComp = components.find(c => c.id === conn.to);
            
            if (!fromComp || !toComp) return;
            
            const fromSymbol = symbols[fromComp.type];
            const toSymbol = symbols[toComp.type];
            
            if (conn.type === 'daisy_positive') {
                const endX = toComp.x;
                const endY = toComp.y + toSymbol.height / 4;
                
                ctx.strokeStyle = '#dc2626';
                ctx.lineWidth = 3;
                ctx.beginPath();
                
                if (fromComp.type === 'isolator') {
                    const startX = fromComp.x + fromSymbol.width;
                    const startY = fromComp.y + fromSymbol.height / 4;
                    const midX = Math.max(endX - 40, startX + 10);
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(midX, startY);
                    ctx.lineTo(midX, endY);
                    ctx.lineTo(endX, endY);
                } else if (fromComp.type === 'inverter') {
                    const slotInfo = isolatorSlotLookup[toComp.id] || { slotIndex: 0, totalSlots: 1 };
                    const startY = getInverterConnectionY(fromComp, slotInfo, 'positive');
                    const startX = fromComp.x + fromSymbol.width;
                    
                    const baseOffset = 28;
                    const laneSpacing = 32;
                    const maxLaneX = endX - 20;
                    const laneX = Math.min(startX + baseOffset + (slotInfo.slotIndex * laneSpacing), maxLaneX);
                    const isolatorConnectionY = toComp.y + (toSymbol.height / 4);
                    
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(laneX, startY);
                    ctx.lineTo(laneX, isolatorConnectionY);
                    ctx.lineTo(endX, isolatorConnectionY);
                } else {
                    const startX = fromComp.x + fromSymbol.width;
                    const startY = fromComp.y + fromSymbol.height / 4;
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                }
                ctx.stroke();
            } else if (conn.type === 'daisy_negative_return') {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3;
                ctx.beginPath();
                
                if (fromComp.type === 'isolator' && toComp.type === 'inverter') {
                    const slotInfo = isolatorSlotLookup[fromComp.id] || { slotIndex: 0, totalSlots: 1 };
                    const endX = toComp.x + toSymbol.width;
                    const endY = getInverterConnectionY(toComp, slotInfo, 'negative');
                    const startX = fromComp.x + fromSymbol.width;
                    const isolatorConnectionY = fromComp.y + (fromSymbol.height * 3 / 4);
                    
                    const baseOffset = 60;
                    const laneSpacing = 36;
                    const laneX = endX + baseOffset + (slotInfo.slotIndex * laneSpacing);
                    
                    ctx.moveTo(startX, isolatorConnectionY);
                    ctx.lineTo(laneX, isolatorConnectionY);
                    ctx.lineTo(laneX, endY);
                    ctx.lineTo(endX, endY);
                } else {
                    const startX = fromComp.x + fromSymbol.width;
                    const startY = fromComp.y + (fromSymbol.height * 3 / 4);
                    const endX = toComp.x + toSymbol.width;
                    const endY = toComp.y + (toSymbol.height * 3 / 4);
                    const jog = 15;
                    const dropOffset = 25;
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(startX + jog, startY);
                    ctx.lineTo(startX + jog, startY + dropOffset);
                    ctx.lineTo(endX + jog, startY + dropOffset);
                    ctx.lineTo(endX + jog, endY);
                    ctx.lineTo(endX, endY);
                }
                ctx.stroke();
            }
        });
        
        // Draw components
        components.forEach(comp => {
            const symbol = symbols[comp.type];
            
            // Draw component rectangle
            ctx.fillStyle = comp.type === 'pvString' ? 'lightblue' : 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            
            if (comp.type === 'inverter') {
                ctx.beginPath();
                ctx.roundRect(comp.x, comp.y, symbol.width, symbol.height, 5);
                ctx.fill();
                ctx.stroke();
            } else if (comp.type === 'isolator') {
                ctx.fillRect(comp.x, comp.y, symbol.width, symbol.height);
                ctx.strokeRect(comp.x, comp.y, symbol.width, symbol.height);
                
                ctx.beginPath();
                ctx.moveTo(comp.x + 10, comp.y + 20);

                ctx.stroke();
            } else if (comp.type === 'pvString') {
                ctx.fillRect(comp.x, comp.y, symbol.width, symbol.height);
                ctx.strokeRect(comp.x, comp.y, symbol.width, symbol.height);
            }
            
            // Draw label
            if (comp.label) {
                ctx.fillStyle = 'black';
                ctx.textAlign = 'center';
                
                if (comp.type === 'pvString') {
                    ctx.font = '9px Arial';
                    ctx.fillText(comp.label, comp.x + symbol.width / 2, comp.y - 5);
                } else {
                    ctx.font = '12px Arial';
                    ctx.fillText(comp.label, comp.x + symbol.width / 2, comp.y + symbol.height + 15);
                }
            }
        });
    </script>
</body>
</html>`;
  }

  /**
   * Convert JSON file to Canvas HTML and save to file
   * @param {string} inputPath - Path to input JSON file
   * @param {string} outputPath - Path to output HTML file
   * @param {Object} options - HTML generation options
   */
  async convertFileToCanvas(inputPath, outputPath, options = {}) {
    try {
      const jsonData = JSON.parse(await fs.readFile(inputPath, 'utf8'));
      const htmlContent = await this.convertToCanvas(jsonData, options);
      await fs.writeFile(outputPath, htmlContent, 'utf8');
      console.log(`✅ Canvas HTML diagram generated: ${outputPath}`);
      return htmlContent;
    } catch (error) {
      console.error(`❌ Error converting file to Canvas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get system statistics from JSON data
   * @param {Object} jsonData - The electrical system JSON data
   * @returns {Object} System statistics
   */
  getSystemStats(jsonData) {
    let totalInverters = 0;
    let totalIsolators = 0;
    let totalPVStrings = 0;
    let totalPanels = 0;

    jsonData.inverters.forEach(inverter => {
      totalInverters++;
      inverter.isolators.forEach(isolator => {
        totalIsolators++;
        isolator.pvstrings.forEach(pvString => {
          totalPVStrings++;
          totalPanels += pvString.length;
        });
      });
    });

    return {
      inverters: totalInverters,
      isolators: totalIsolators,
      pvStrings: totalPVStrings,
      totalPanels: totalPanels
    };
  }
}

module.exports = SLDConverter;
