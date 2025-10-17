# HTML to PDF Converter

A powerful Node.js application that converts HTML files and URLs to PDF documents using Puppeteer. This tool provides a comprehensive CLI interface with advanced configuration options for high-quality PDF generation.

## 🚀 Features

- **HTML File Conversion**: Convert local HTML files to PDF
- **URL Conversion**: Convert web pages directly to PDF
- **Advanced Styling Support**: Preserves CSS gradients, shadows, grid layouts, and complex styling
- **Flexible Configuration**: Customizable page formats, margins, headers, and footers
- **Asset Resolution**: Automatically resolves relative paths for images and stylesheets
- **CLI Interface**: Easy-to-use command-line interface with multiple options
- **High Quality Output**: Professional-grade PDF generation with background graphics

## 📋 Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn package manager

## 🛠️ Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

## 📖 Usage

### Basic HTML File Conversion

Convert a local HTML file to PDF:

```bash
node index.js convert input.html output.pdf
```

### URL to PDF Conversion

Convert a web page to PDF:

```bash
node index.js url https://example.com output.pdf
```

### Advanced Options

#### Format and Layout Options

```bash
# Use A3 format with custom margins
node index.js convert input.html output.pdf --format A3 --margin "2cm"

# Disable background graphics
node index.js convert input.html output.pdf --no-background

# Custom viewport size
node index.js convert input.html output.pdf --viewport "1920x1080"
```

#### Header and Footer

```bash
# Add headers and footers
node index.js convert input.html output.pdf --header --footer
```

#### Delay for Dynamic Content

```bash
# Wait 3 seconds before generating PDF (useful for dynamic content)
node index.js convert input.html output.pdf --delay 3000
```

### Complete Example

```bash
# Convert a complex HTML file with all options
node index.js convert samples/complex.html output.pdf \
  --format A4 \
  --margin "1.5cm" \
  --viewport "1920x1080" \
  --delay 2000 \
  --header \
  --footer
```

## 📁 Project Structure

```
html-to-pdf-converter/
├── index.js              # Main application file
├── package.json          # Project dependencies and scripts
├── README.md            # This documentation
├── samples/             # Sample HTML files for testing
│   ├── simple.html      # Basic HTML sample
│   └── complex.html     # Advanced HTML with complex styling
└── test.js              # Test script (optional)
```

## 🔧 Configuration Options

### PDF Format Options
- `A4` (default)
- `A3`
- `A2`
- `A1`
- `A0`
- `Letter`
- `Legal`
- `Tabloid`

### Margin Options
- Single value: `"1cm"` (applies to all sides)
- Individual values: `"1cm 2cm 1cm 2cm"` (top right bottom left)

### Viewport Options
- Format: `"widthxheight"` (e.g., `"1920x1080"`)
- Common resolutions: `"1920x1080"`, `"1366x768"`, `"1440x900"`

## 🧪 Testing

Test the converter with the included sample files:

```bash
# Test with simple HTML
node index.js convert samples/simple.html test-simple.pdf

# Test with complex HTML
node index.js convert samples/complex.html test-complex.pdf

# Test URL conversion
node index.js url https://example.com test-url.pdf
```

## 🎯 Use Cases

- **Document Generation**: Convert HTML reports to PDF
- **Web Page Archiving**: Save web pages as PDF documents
- **Invoice Generation**: Convert HTML invoices to PDF
- **Report Exporting**: Export dashboard data as PDF
- **Documentation**: Convert HTML documentation to PDF
- **Email Templates**: Convert HTML emails to PDF

## ⚙️ Advanced Usage

### Programmatic Usage

You can also use the converter programmatically:

```javascript
const HTMLToPDFConverter = require('./index.js');

async function convertDocument() {
    const converter = new HTMLToPDFConverter();
    
    try {
        await converter.initialize();
        
        const htmlContent = `
            <html>
                <body>
                    <h1>Hello World</h1>
                    <p>This is a test document.</p>
                </body>
            </html>
        `;
        
        await converter.convertHTMLToPDF(htmlContent, 'output.pdf', {
            format: 'A4',
            printBackground: true,
            margin: '1cm'
        });
        
    } finally {
        await converter.close();
    }
}

convertDocument();
```

### Batch Processing

For batch processing multiple files:

```bash
# Convert multiple files
for file in *.html; do
    node index.js convert "$file" "${file%.html}.pdf"
done
```

## 🐛 Troubleshooting

### Common Issues

1. **Browser Launch Fails**
   - Ensure you have sufficient system resources
   - Try running with `--no-sandbox` flag (already included)

2. **Assets Not Loading**
   - Use absolute paths for images and stylesheets
   - Ensure all referenced files exist

3. **Layout Issues**
   - Use print-friendly CSS
   - Avoid fixed positioning
   - Test with different viewport sizes

4. **Font Issues**
   - Use web-safe fonts or embed fonts
   - Ensure font files are accessible
