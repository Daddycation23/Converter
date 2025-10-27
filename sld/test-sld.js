#!/usr/bin/env node

/**
 * Test script for JSON to Single Line Diagram converter
 */

const SLDConverter = require('./sld-converter');
const chalk = require('chalk');
const path = require('path');

async function testSLDConverter() {
  console.log(chalk.blue('🧪 Testing SLD Converter...'));
  
  try {
    // Initialize converter
    const converter = new SLDConverter({
      width: 1200,
      height: 800,
      margin: 50,
      componentSpacing: 80
    });

    // Test with sample data
    const inputFile = path.join(__dirname, 'PVArray1.json');
    const outputCanvas = path.join(__dirname, 'output-sld.html');
    
    console.log(chalk.yellow(`🎨 Converting ${inputFile} to Canvas HTML...`));
    await converter.convertFileToCanvas(inputFile, outputCanvas, {
      title: 'PV Array Single Line Diagram'
    });

    // Display system statistics
    const fs = require('fs');
    const jsonData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    const stats = converter.getSystemStats(jsonData);
    
    console.log(chalk.green('\n✅ Test completed successfully!'));
    console.log(chalk.blue('\n📈 System Statistics:'));
    console.log(chalk.blue(`   Inverters: ${stats.inverters}`));
    console.log(chalk.blue(`   Isolators: ${stats.isolators}`));
    console.log(chalk.blue(`   PV Strings: ${stats.pvStrings}`));
    console.log(chalk.blue(`   Total Panels: ${stats.totalPanels}`));
    
    console.log(chalk.green('\n📁 Generated file:'));
    console.log(chalk.green(`   Canvas HTML: ${outputCanvas}`));

  } catch (error) {
    console.error(chalk.red(`❌ Test failed: ${error.message}`));
    process.exit(1);
  }
}

// Run test
testSLDConverter();
