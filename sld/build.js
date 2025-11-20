const fs = require('fs');
const path = require('path');
const { program } = require('commander');

program
  .name('sld-builder')
  .description('Generate SLD HTML from JSON input')
  .argument('<input>', 'Input JSON file path')
  .option('-o, --output <output>', 'Output HTML file path')
  .action((input, options) => {
    try {
        const absoluteInputPath = path.resolve(input);
        
        if (!fs.existsSync(absoluteInputPath)) {
            console.error(`Error: Input file not found: ${absoluteInputPath}`);
            process.exit(1);
        }

        const inputFilename = path.basename(absoluteInputPath, '.json');
        const jsonContent = JSON.parse(fs.readFileSync(absoluteInputPath, 'utf8'));

        const sldDir = __dirname;
        const templatePath = path.join(sldDir, 'template.html');
        
        // Determine output path
        // If option provided, use it.
        // Else, use the input filename but with .html extension in the same directory (or sld dir)
        let outputPath;
        if (options.output) {
            outputPath = path.resolve(options.output);
        } else {
            outputPath = path.join(path.dirname(absoluteInputPath), `${inputFilename}.html`);
        }

        // Read Template
        let template = fs.readFileSync(templatePath, 'utf8');

        // Inject Data
        const dataScript = `
<script>
  const pvData = {
    "${inputFilename}": ${JSON.stringify(jsonContent)}
  };
</script>
`;

        // Insert data script
        if (template.includes('<!-- DATA_INJECTION -->')) {
            template = template.replace('<!-- DATA_INJECTION -->', dataScript);
        } else {
            template = template.replace('</body>', `${dataScript}</body>`);
        }

        fs.writeFileSync(outputPath, template);
        console.log(`SLD HTML generated successfully!`);
        console.log(`Input: ${absoluteInputPath}`);
        console.log(`Output: ${outputPath}`);

    } catch (error) {
        console.error('Error generating SLD:', error.message);
        process.exit(1);
    }
  });

program.parse();
