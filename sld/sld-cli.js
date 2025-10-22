#!/usr/bin/env node

/**
 * CLI interface for JSON to Single Line Diagram converter
 */

const { program } = require('commander');
const chalk = require('chalk');
const path = require('path');
const SLDConverter = require('./sld-converter');

// CLI Interface
program
  .name('sld-converter')
  .description('Convert electrical system JSON data to single line diagrams')
  .version('1.0.0');

program
  .command('convert')
  .description('Convert JSON file to SVG single line diagram')
  .argument('<input>', 'Input JSON file path')
  .argument('<output>', 'Output SVG file path')
  .option('-w, --width <width>', 'SVG width in pixels', '1200')
  .option('-h, --height <height>', 'SVG height in pixels', '800')
  .option('-m, --margin <margin>', 'Diagram margin in pixels', '50')
  .option('-s, --spacing <spacing>', 'Component spacing in pixels', '100')
  .action(async (input, output, options) => {
    const converter = new SLDConverter({
      width: parseInt(options.width),
      height: parseInt(options.height),
      margin: parseInt(options.margin),
      componentSpacing: parseInt(options.spacing)
    });
    
    try {
      console.log(chalk.yellow(`📊 Converting: ${input} → ${output}`));
      await converter.convertFile(input, output);
      
      // Display system statistics
      const jsonData = JSON.parse(require('fs').readFileSync(input, 'utf8'));
      const stats = converter.getSystemStats(jsonData);
      
      console.log(chalk.blue('\n📈 System Statistics:'));
      console.log(chalk.blue(`   Inverters: ${stats.inverters}`));
      console.log(chalk.blue(`   Isolators: ${stats.isolators}`));
      console.log(chalk.blue(`   PV Strings: ${stats.pvStrings}`));
      console.log(chalk.blue(`   Total Panels: ${stats.totalPanels}`));
      
    } catch (error) {
      console.error(chalk.red(`💥 Conversion failed: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('html')
  .description('Convert JSON file to HTML with embedded SVG')
  .argument('<input>', 'Input JSON file path')
  .argument('<output>', 'Output HTML file path')
  .option('-t, --title <title>', 'HTML page title', 'Electrical Single Line Diagram')
  .option('-w, --width <width>', 'SVG width in pixels', '1200')
  .option('-h, --height <height>', 'SVG height in pixels', '800')
  .action(async (input, output, options) => {
    const converter = new SLDConverter({
      width: parseInt(options.width),
      height: parseInt(options.height)
    });
    
    try {
      console.log(chalk.yellow(`🌐 Converting: ${input} → ${output}`));
      await converter.convertFileToHTML(input, output, {
        title: options.title
      });
      
    } catch (error) {
      console.error(chalk.red(`💥 Conversion failed: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('stats')
  .description('Display system statistics from JSON file')
  .argument('<input>', 'Input JSON file path')
  .action(async (input) => {
    try {
      const jsonData = JSON.parse(require('fs').readFileSync(input, 'utf8'));
      const converter = new SLDConverter();
      const stats = converter.getSystemStats(jsonData);
      
      console.log(chalk.blue(`📊 System Statistics for: ${input}`));
      console.log(chalk.green(`   Inverters: ${stats.inverters}`));
      console.log(chalk.green(`   Isolators: ${stats.isolators}`));
      console.log(chalk.green(`   PV Strings: ${stats.pvStrings}`));
      console.log(chalk.green(`   Total Panels: ${stats.totalPanels}`));
      
    } catch (error) {
      console.error(chalk.red(`💥 Error reading file: ${error.message}`));
      process.exit(1);
    }
  });

// If no command is provided, show help
if (process.argv.length <= 2) {
  program.help();
}

program.parse();
