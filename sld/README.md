# JSON to Single Line Diagram Converter

A Node.js module for converting electrical system JSON data into professional single line diagrams (SLD) for electrical engineering applications.

## Features

- **SVG Generation**: Creates scalable vector graphics for electrical diagrams
- **HTML Output**: Generates HTML pages with embedded SVG diagrams
- **Electrical Symbols**: Built-in symbols for inverters, isolators, PV strings, and connections
- **System Statistics**: Analyzes and reports system components and specifications
- **CLI Interface**: Command-line tools for easy integration
- **Customizable**: Configurable dimensions, spacing, and styling

## Installation

The module is already included in this project. No additional installation required.

## Usage

### Command Line Interface

#### Convert JSON to SVG
```bash
npm run sld convert sld/PVArray1.json output.svg
```

#### Convert JSON to HTML
```bash
npm run sld html sld/PVArray1.json output.html
```

#### Display System Statistics
```bash
npm run sld stats sld/PVArray1.json
```

### Programmatic Usage

```javascript
const SLDConverter = require('./src/sld-converter');

// Initialize converter
const converter = new SLDConverter({
  width: 1200,
  height: 800,
  margin: 50,
  componentSpacing: 100
});

// Convert JSON to SVG
await converter.convertFile('input.json', 'output.svg');

// Convert JSON to HTML
await converter.convertFileToHTML('input.json', 'output.html', {
  title: 'My Electrical Diagram'
});

// Get system statistics
const stats = converter.getSystemStats(jsonData);
```

## JSON Data Format

The converter expects JSON data in the following format:

```json
{
  "inverters": [
    {
      "isolators": [
        {
          "pvstrings": [
            {
              "model": "Panasonic 330W HiT",
              "length": 10
            }
          ]
        }
      ]
    }
  ]
}
```

### Data Structure

- **inverters**: Array of inverter objects
- **isolators**: Array of isolator objects within each inverter
- **pvstrings**: Array of PV string objects within each isolator
- **model**: PV panel model name
- **length**: Number of panels in the string

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | number | 1200 | SVG width in pixels |
| `height` | number | 800 | SVG height in pixels |
| `margin` | number | 50 | Diagram margin in pixels |
| `componentSpacing` | number | 100 | Spacing between components |
| `lineThickness` | number | 2 | Line thickness for connections |
| `fontSize` | number | 12 | Font size for labels |

## Electrical Symbols

The converter includes standard electrical symbols:

- **Inverter**: Rectangular symbol with "INV" label
- **Isolator**: Circular symbol with disconnect line
- **PV String**: Rectangular symbol with "PV" label
- **Busbar**: Horizontal line for power distribution
- **Connections**: Lines connecting components

## Testing

Run the test script to verify functionality:

```bash
npm run test-sld
```

This will:
1. Convert the sample JSON file to SVG
2. Convert the sample JSON file to HTML
3. Display system statistics
4. Generate output files for inspection

## Output Files

- **SVG Files**: Scalable vector graphics suitable for technical documentation
- **HTML Files**: Web-ready diagrams with embedded SVG and styling
- **Statistics**: Component counts and system specifications

## Examples

### Basic Conversion
```bash
# Convert to SVG
npm run sld convert sld/PVArray1.json diagram.svg

# Convert to HTML with custom title
npm run sld html sld/PVArray1.json diagram.html --title "Solar Array SLD"
```

### Custom Dimensions
```bash
# Large diagram
npm run sld convert sld/PVArray1.json large.svg --width 1600 --height 1200

# Compact diagram
npm run sld convert sld/PVArray1.json compact.svg --width 800 --height 600
```

## Integration with PDF Converter

The SLD converter can be integrated with the existing HTML-to-PDF converter:

```bash
# Generate HTML diagram
npm run sld html sld/PVArray1.json temp.html

# Convert to PDF
npm run start convert temp.html output.pdf
```

## File Structure

```
src/
├── sld-converter.js    # Core converter module
└── sld-cli.js         # Command-line interface

sld/
└── PVArray1.json      # Sample electrical system data

test-sld.js            # Test script
SLD-README.md          # This documentation
```

## Error Handling

The converter includes comprehensive error handling for:
- Invalid JSON format
- Missing required fields
- File system errors
- SVG generation errors

## Performance

- Optimized for systems with up to 1000+ components
- Efficient SVG generation
- Minimal memory footprint
- Fast processing for typical electrical systems

## Contributing

To extend the converter:

1. Add new electrical symbols to `initializeSymbols()`
2. Modify the layout algorithm in `convertToSVG()`
3. Update the CLI interface in `sld-cli.js`
4. Add tests for new functionality

## License

MIT License - Same as the main project.
