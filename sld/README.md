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

```bash
npm install
```

### Command Line Interface
```bash

# cd to sld
cd sld

# Convert to SVG
node sld-cli convert input.json output.html

# Convert to HTML with custom title
node sld-cli convert input.json output.html --title "Solar Array SLD"
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


### Custom Dimensions
```bash
# Large diagram
node sld-cli convert input.json output.html --width 1600 --height 1200

# Compact diagram
node sld-cli convert input.json output.html --width 800 --height 600
```


