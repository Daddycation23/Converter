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
      busbar: {
        width: 20,
        height: 400,
        svg: `<rect x="0" y="0" width="20" height="400" fill="black" stroke="black" stroke-width="2"/>`
      },
      connection: {
        svg: `<line x1="0" y1="0" x2="100" y2="0" stroke="black" stroke-width="2"/>`
      }
    };
  }

  /**
   * Convert JSON data to SVG single line diagram
   * @param {Object} jsonData - The electrical system JSON data
   * @returns {string} SVG content
   */
  async convertToSVG(jsonData) {
    const components = [];
    const connections = [];

    // Column layout (busbar → inverter → isolator → PV strings)
    const busbarX = this.options.margin;
    const inverterX = busbarX + 200;
    const isolatorX = inverterX + 200;
    const pvStringX = isolatorX + 220;
    const pvStringsPerRow = 4;
    const pvStringSpacing = 110;
    const pvStringRowSpacing = 90;
    const betweenInvertersSpacing = 150;

    // Add a single dynamic-height busbar (height will be updated after layout)
    const busbarComponent = {
      id: 'busbar_main',
      type: 'busbar',
      x: busbarX,
      y: this.options.margin, // temp; will be updated
      width: 20,
      height: 100,
      label: 'Main Bus'
    };
    components.push(busbarComponent);

    // Layout each inverter block vertically
    let currentY = this.options.margin + 120;
    let layoutTop = Infinity;
    let layoutBottom = -Infinity;

    for (let i = 0; i < jsonData.inverters.length; i++) {
      const inverter = jsonData.inverters[i];

      // Calculate the vertical height consumed by this inverter block
      let blockHeight = 0;
      for (let j = 0; j < inverter.isolators.length; j++) {
        const iso = inverter.isolators[j];
        const rows = Math.ceil(iso.pvstrings.length / pvStringsPerRow);
        blockHeight += (rows * pvStringRowSpacing) + 120; // space for isolator + grid
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

      // Busbar → Inverter connection (drawn as horizontal run later)
      connections.push({
        from: 'busbar_main',
        to: `inverter_${i}`,
        type: 'busbar_connection'
      });

      // Isolators and PV strings for this inverter
      let isolatorY = inverterCenterY - (blockHeight / 2);
      for (let j = 0; j < inverter.isolators.length; j++) {
        const isolator = inverter.isolators[j];

        const isolatorComponent = {
          id: `isolator_${i}_${j}`,
          type: 'isolator',
          x: isolatorX,
          y: isolatorY,
          label: `DC Isolator ${i + 1}-${j + 1}`
        };
        components.push(isolatorComponent);

        // Isolator → Inverter
        connections.push({
          from: `isolator_${i}_${j}`,
          to: `inverter_${i}`,
          type: 'dc_connection'
        });

        const rows = Math.ceil(isolator.pvstrings.length / pvStringsPerRow);
        const totalWidth = (pvStringsPerRow - 1) * pvStringSpacing;
        const startX = pvStringX - (totalWidth / 2);

        for (let k = 0; k < isolator.pvstrings.length; k++) {
          const pvString = isolator.pvstrings[k];
          const row = Math.floor(k / pvStringsPerRow);
          const col = k % pvStringsPerRow;

          const pvComponent = {
            id: `pv_${i}_${j}_${k}`,
            type: 'pvString',
            x: startX + (col * pvStringSpacing),
            y: isolatorY + 80 + (row * pvStringRowSpacing),
            label: `${pvString.model} (${pvString.length} panels)`
          };
          components.push(pvComponent);

          connections.push({
            from: `pv_${i}_${j}_${k}`,
            to: `isolator_${i}_${j}`,
            type: 'pv_connection'
          });
        }

        isolatorY += (rows * pvStringRowSpacing) + 120;
      }

      // Track overall vertical extent for busbar sizing
      layoutTop = Math.min(layoutTop, inverterCenterY - (blockHeight / 2));
      layoutBottom = Math.max(layoutBottom, inverterCenterY + (blockHeight / 2));

      currentY += blockHeight + betweenInvertersSpacing;
    }

    // Update busbar height to span all inverters neatly
    const busbarPadding = 60;
    if (layoutTop !== Infinity && layoutBottom !== -Infinity) {
      busbarComponent.y = layoutTop - busbarPadding;
      busbarComponent.height = (layoutBottom - layoutTop) + (busbarPadding * 2);
    }

    // Expand canvas to fit content
    let maxRight = 0;
    let maxBottom = 0;
    components.forEach(c => {
      const symbol = this.symbols[c.type];
      const width = c.type === 'busbar' ? (c.width || 20) : symbol.width;
      const height = c.type === 'busbar' ? (c.height || symbol.height) : symbol.height;
      maxRight = Math.max(maxRight, c.x + width);
      maxBottom = Math.max(maxBottom, c.y + height);
    });

    this.options.width = Math.max(this.options.width, maxRight + this.options.margin + 80);
    this.options.height = Math.max(this.options.height, maxBottom + this.options.margin + 120);

    return this.generateSVG(components, connections);
  }

  /**
   * Generate SVG content from components and connections
   * @param {Array} components - Array of component objects
   * @param {Array} connections - Array of connection objects
   * @returns {string} Complete SVG content
   */
  generateSVG(components, connections) {
    const svgWidth = this.options.width;
    const svgHeight = this.options.height;

    let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .component { cursor: pointer; }
          .component:hover { opacity: 0.7; }
          .connection { stroke: #333; stroke-width: 3; }
          .positive-connection { stroke: #dc2626; stroke-width: 3; }
          .negative-connection { stroke: #000000; stroke-width: 3; }
          .busbar-connection { stroke: #1f2937; stroke-width: 4; }
          .dc-connection { stroke: #059669; stroke-width: 3; }
          .label { font-family: Arial, sans-serif; font-size: ${this.options.fontSize}px; }
          .title { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; }
        </style>
      </defs>
      <rect width="100%" height="100%" fill="white"/>
      <g class="diagram">`;

    // Add title
    svgContent += `<text x="${this.options.width / 2}" y="30" text-anchor="middle" class="title">Electrical Single Line Diagram</text>`;

    // Add connections first (so they appear behind components)
    connections.forEach(conn => {
      const fromComp = components.find(c => c.id === conn.from);
      const toComp = components.find(c => c.id === conn.to);
      
      if (fromComp && toComp) {
        const fromSymbol = this.symbols[fromComp.type] || {};
        const toSymbol = this.symbols[toComp.type] || {};
        const fromCenterX = fromComp.x + (fromComp.type === 'busbar' ? (fromComp.width || 20) / 2 : fromSymbol.width / 2);
        const fromCenterY = fromComp.y + (fromComp.type === 'busbar' ? (fromComp.height || fromSymbol.height) / 2 : fromSymbol.height / 2);
        const toCenterX = toComp.x + (toComp.type === 'busbar' ? (toComp.width || 20) / 2 : toSymbol.width / 2);
        const toCenterY = toComp.y + (toComp.type === 'busbar' ? (toComp.height || toSymbol.height) / 2 : toSymbol.height / 2);
        
        // Draw positive and negative lines for electrical connections
        if (conn.type === 'pv_connection' || conn.type === 'dc_connection') {
          // Clean orthogonal routing with parallel positive/negative paths
          // Determine edge anchors
          let sx, sy, tx, ty;
          if (conn.type === 'pv_connection') {
            // PV (right) → Isolator (left)
            sx = fromComp.x; // left edge of PV
            sy = fromComp.y + fromSymbol.height / 2;
            tx = toComp.x + toSymbol.width; // right edge of isolator
            ty = toComp.y + toSymbol.height / 2;
          } else {
            // Isolator (right) → Inverter (left)
            sx = fromComp.x; // left edge of isolator
            sy = fromComp.y + fromSymbol.height / 2;
            tx = toComp.x + toSymbol.width; // right edge of inverter
            ty = toComp.y + toSymbol.height / 2;
          }

          // Create a vertical jog near the destination side to bundle lines neatly
          const nearDestX = tx - 30;
          const posOffset = -4;
          const negOffset = 4;
          // small horizontal separation so vertical legs don't overlap
          const posX = nearDestX - 4;
          const negX = nearDestX + 4;

          const makePath = (offset, midX) => `M ${sx} ${sy + offset} L ${midX} ${sy + offset} L ${midX} ${ty + offset} L ${tx} ${ty + offset}`;

          // Positive (red) and negative (black) parallel polylines with separated verticals
          svgContent += `<path d="${makePath(posOffset, posX)}" fill="none" stroke="#dc2626" stroke-width="3" class="positive-connection"/>`;
          svgContent += `<path d="${makePath(negOffset, negX)}" fill="none" stroke="#000000" stroke-width="3" class="negative-connection"/>`;
        } else if (conn.type === 'busbar_connection') {
          // Busbar connection: horizontal run from busbar edge to inverter left edge
          const busbar = fromComp.type === 'busbar' ? fromComp : toComp;
          const other = fromComp.type === 'busbar' ? toComp : fromComp;
          const otherSymbol = this.symbols[other.type];
          const y = other.y + otherSymbol.height / 2;
          const fromX = busbar.x + (busbar.width || 20);
          const toX = other.x;
          svgContent += `<line x1="${fromX}" y1="${y}" x2="${toX}" y2="${y}" class="busbar-connection"/>`;
        } else {
          // Standard connection
          svgContent += `<line x1="${fromCenterX}" y1="${fromCenterY}" x2="${toCenterX}" y2="${toCenterY}" class="connection"/>`;
        }
      }
    });

    // Add components
    components.forEach(comp => {
      const symbol = this.symbols[comp.type];
      let symbolSvg;
      if (comp.type === 'busbar') {
        const width = comp.width || 20;
        const height = comp.height || symbol.height;
        symbolSvg = `<rect x="${comp.x}" y="${comp.y}" width="${width}" height="${height}" fill="black" stroke="black" stroke-width="2"/>`;
      } else {
        symbolSvg = symbol.svg.replace(/x="0"/g, `x="${comp.x}"`).replace(/y="0"/g, `y="${comp.y}"`);
      }
      
      // Adjust label positioning based on component type
      const effectiveHeight = comp.type === 'busbar' ? (comp.height || symbol.height) : symbol.height;
      const effectiveWidth = comp.type === 'busbar' ? (comp.width || 20) : symbol.width;
      let labelY = comp.y + effectiveHeight + 15;
      let labelX = comp.x + effectiveWidth / 2;
      
      if (comp.type === 'pvString') {
        // Position PV string labels to avoid overlap
        labelY = comp.y - 5;
      } else if (comp.type === 'busbar') {
        // Position busbar label to the left, centered vertically
        labelX = comp.x - 10;
        labelY = comp.y + effectiveHeight / 2;
      }
      
      svgContent += `<g class="component" id="${comp.id}">
        ${symbolSvg}
        <text x="${labelX}" y="${labelY}" 
              text-anchor="${comp.type === 'busbar' ? 'end' : 'middle'}" 
              class="label" font-size="${comp.type === 'pvString' ? '9' : this.options.fontSize}">${comp.label}</text>
      </g>`;
    });

    // Add legend
    const legendY = this.options.height - 80;
    svgContent += `<g class="legend">
      <text x="50" y="${legendY}" class="label" font-weight="bold">Legend:</text>
      <line x1="50" y1="${legendY + 15}" x2="80" y2="${legendY + 15}" class="positive-connection"/>
      <text x="90" y="${legendY + 20}" class="label">Positive (Red)</text>
      <line x1="200" y1="${legendY + 15}" x2="230" y2="${legendY + 15}" class="negative-connection"/>
      <text x="240" y="${legendY + 20}" class="label">Negative (Black)</text>
      <line x1="350" y1="${legendY + 15}" x2="380" y2="${legendY + 15}" class="busbar-connection"/>
      <text x="390" y="${legendY + 20}" class="label">Busbar</text>
    </g>`;

    svgContent += `</g></svg>`;
    return svgContent;
  }

  /**
   * Convert JSON file to SVG and save to file
   * @param {string} inputPath - Path to input JSON file
   * @param {string} outputPath - Path to output SVG file
   */
  async convertFile(inputPath, outputPath) {
    try {
      const jsonData = JSON.parse(await fs.readFile(inputPath, 'utf8'));
      const svgContent = await this.convertToSVG(jsonData);
      await fs.writeFile(outputPath, svgContent, 'utf8');
      console.log(`✅ Single line diagram generated: ${outputPath}`);
      return svgContent;
    } catch (error) {
      console.error(`❌ Error converting file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Convert JSON data to HTML with embedded SVG
   * @param {Object} jsonData - The electrical system JSON data
   * @param {Object} options - HTML generation options
   * @returns {string} HTML content
   */
  async convertToHTML(jsonData, options = {}) {
    const svgContent = await this.convertToSVG(jsonData);
    const title = options.title || 'Electrical Single Line Diagram';
    
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
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 20px;
        }
        .diagram-container {
            text-align: center;
            overflow: auto;
        }
        svg {
            border: 1px solid #ddd;
            background-color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        <div class="diagram-container">
            ${svgContent}
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Convert JSON file to HTML and save to file
   * @param {string} inputPath - Path to input JSON file
   * @param {string} outputPath - Path to output HTML file
   * @param {Object} options - HTML generation options
   */
  async convertFileToHTML(inputPath, outputPath, options = {}) {
    try {
      const jsonData = JSON.parse(await fs.readFile(inputPath, 'utf8'));
      const htmlContent = await this.convertToHTML(jsonData, options);
      await fs.writeFile(outputPath, htmlContent, 'utf8');
      console.log(`✅ HTML single line diagram generated: ${outputPath}`);
      return htmlContent;
    } catch (error) {
      console.error(`❌ Error converting file to HTML: ${error.message}`);
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
