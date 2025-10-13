#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing HTML to PDF Converter...\n');

// Test if dependencies are installed
function checkDependencies() {
    console.log('📦 Checking dependencies...');
    try {
        require('puppeteer');
        require('commander');
        require('chalk');
        console.log('✅ All dependencies are installed');
        return true;
    } catch (error) {
        console.log('❌ Missing dependencies. Please run: npm install');
        return false;
    }
}

// Test basic functionality
async function testBasicConversion() {
    console.log('\n🔄 Testing basic HTML to PDF conversion...');
    
    try {
        const inputFile = 'samples/simple.html';
        const outputFile = 'test-output-simple.pdf';
        
        // Check if input file exists
        if (!fs.existsSync(inputFile)) {
            console.log('❌ Input file not found:', inputFile);
            return false;
        }
        
        // Run conversion
        execSync(`node index.js convert "${inputFile}" "${outputFile}"`, { stdio: 'inherit' });
        
        // Check if output file was created
        if (fs.existsSync(outputFile)) {
            const stats = fs.statSync(outputFile);
            console.log(`✅ PDF generated successfully: ${outputFile} (${stats.size} bytes)`);
            
            // Clean up test file
            fs.unlinkSync(outputFile);
            return true;
        } else {
            console.log('❌ PDF file was not created');
            return false;
        }
    } catch (error) {
        console.log('❌ Basic conversion test failed:', error.message);
        return false;
    }
}

// Test advanced conversion
async function testAdvancedConversion() {
    console.log('\n🔄 Testing advanced HTML to PDF conversion...');
    
    try {
        const inputFile = 'samples/complex.html';
        const outputFile = 'test-output-complex.pdf';
        
        // Check if input file exists
        if (!fs.existsSync(inputFile)) {
            console.log('❌ Input file not found:', inputFile);
            return false;
        }
        
        // Run conversion with advanced options
        execSync(`node index.js convert "${inputFile}" "${outputFile}" --format A4 --header --footer --delay 1000`, { stdio: 'inherit' });
        
        // Check if output file was created
        if (fs.existsSync(outputFile)) {
            const stats = fs.statSync(outputFile);
            console.log(`✅ Advanced PDF generated successfully: ${outputFile} (${stats.size} bytes)`);
            
            // Clean up test file
            fs.unlinkSync(outputFile);
            return true;
        } else {
            console.log('❌ Advanced PDF file was not created');
            return false;
        }
    } catch (error) {
        console.log('❌ Advanced conversion test failed:', error.message);
        return false;
    }
}

// Test URL conversion (optional - requires internet)
async function testURLConversion() {
    console.log('\n🔄 Testing URL to PDF conversion...');
    
    try {
        const url = 'https://example.com';
        const outputFile = 'test-output-url.pdf';
        
        // Run URL conversion
        execSync(`node index.js url "${url}" "${outputFile}" --delay 3000`, { stdio: 'inherit' });
        
        // Check if output file was created
        if (fs.existsSync(outputFile)) {
            const stats = fs.statSync(outputFile);
            console.log(`✅ URL PDF generated successfully: ${outputFile} (${stats.size} bytes)`);
            
            // Clean up test file
            fs.unlinkSync(outputFile);
            return true;
        } else {
            console.log('❌ URL PDF file was not created');
            return false;
        }
    } catch (error) {
        console.log('⚠️ URL conversion test failed (may be due to network issues):', error.message);
        return false;
    }
}

// Test help command
function testHelpCommand() {
    console.log('\n🔄 Testing help command...');
    
    try {
        execSync('node index.js --help', { stdio: 'inherit' });
        console.log('✅ Help command works correctly');
        return true;
    } catch (error) {
        console.log('❌ Help command test failed:', error.message);
        return false;
    }
}

// Main test runner
async function runTests() {
    const results = [];
    
    // Run all tests
    results.push(checkDependencies());
    results.push(await testBasicConversion());
    results.push(await testAdvancedConversion());
    results.push(await testURLConversion());
    results.push(testHelpCommand());
    
    // Summary
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    
    if (passed === total) {
        console.log('\n🎉 All tests passed! The HTML to PDF converter is working correctly.');
    } else {
        console.log('\n⚠️ Some tests failed. Please check the error messages above.');
    }
    
    return passed === total;
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { runTests };
