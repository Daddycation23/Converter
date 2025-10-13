#!/usr/bin/env node

const puppeteer = require('puppeteer');
const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

class HTMLToPDFConverter {
  constructor() {
    this.browser = null;
  }

  async initialize() {
    console.log(chalk.blue('🚀 Launching browser...'));
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async convertHTMLToPDF(htmlContent, outputPath, options = {}) {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser.newPage();

    try {
      // Set viewport if specified
      if (options.viewport) {
        await page.setViewport(options.viewport);
      }

      // Set content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait for any custom delay
      if (options.delay) {
        await page.waitForTimeout(options.delay);
      }

      // Generate PDF
      const pdfBuffer = await page.pdf({
        path: outputPath,
        format: options.format || 'A4',
        printBackground: options.printBackground !== false,
        margin: options.margin || {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        },
        displayHeaderFooter: options.displayHeaderFooter || false,
        headerTemplate: options.headerTemplate || '',
        footerTemplate: options.footerTemplate || '',
        ...options.pdfOptions
      });

      console.log(chalk.green(`✅ PDF generated successfully: ${outputPath}`));
      return pdfBuffer;

    } catch (error) {
      console.error(chalk.red(`❌ Error generating PDF: ${error.message}`));
      throw error;
    } finally {
      await page.close();
    }
  }

  async convertFileToPDF(inputPath, outputPath, options = {}) {
    try {
      // Read HTML file
      const htmlContent = await fs.readFile(inputPath, 'utf8');
      
      // Resolve relative paths for assets
      const resolvedHtml = await this.resolveAssetPaths(htmlContent, path.dirname(inputPath));
      
      return await this.convertHTMLToPDF(resolvedHtml, outputPath, options);
    } catch (error) {
      console.error(chalk.red(`❌ Error reading HTML file: ${error.message}`));
      throw error;
    }
  }

  async resolveAssetPaths(htmlContent, baseDir) {
    // Simple regex to find relative paths in src and href attributes
    return htmlContent.replace(
      /(src|href)=["']([^"']*)["']/g,
      (match, attr, url) => {
        if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) {
          return match; // Don't modify absolute URLs
        }
        
        const absolutePath = path.resolve(baseDir, url);
        return `${attr}="file://${absolutePath.replace(/\\/g, '/')}"`;
      }
    );
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log(chalk.blue('🔒 Browser closed'));
    }
  }
}

// CLI Interface
program
  .name('html-to-pdf-converter')
  .description('Convert HTML files to PDF using Puppeteer')
  .version('1.0.0');

program
  .command('convert')
  .description('Convert HTML file to PDF')
  .argument('<input>', 'Input HTML file path')
  .argument('<output>', 'Output PDF file path')
  .option('-f, --format <format>', 'PDF format (A4, A3, Letter, Legal)', 'A4')
  .option('-m, --margin <margin>', 'PDF margins (e.g., "1cm" or "10mm")', '1cm')
  .option('--no-background', 'Disable background graphics')
  .option('--viewport <viewport>', 'Viewport size (e.g., "1920x1080")')
  .option('--delay <ms>', 'Delay before PDF generation (milliseconds)', '0')
  .option('--header', 'Enable header template')
  .option('--footer', 'Enable footer template')
  .action(async (input, output, options) => {
    const converter = new HTMLToPDFConverter();
    
    try {
      // Parse options
      const pdfOptions = {
        format: options.format,
        printBackground: options.background !== false,
        delay: parseInt(options.delay),
        margin: options.margin,
        displayHeaderFooter: options.header || options.footer
      };

      if (options.viewport) {
        const [width, height] = options.viewport.split('x');
        pdfOptions.viewport = { width: parseInt(width), height: parseInt(height) };
      }

      if (options.header) {
        pdfOptions.headerTemplate = `
          <div style="font-size: 10px; text-align: center; width: 100%;">
            <span class="title"></span>
          </div>
        `;
      }

      if (options.footer) {
        pdfOptions.footerTemplate = `
          <div style="font-size: 10px; text-align: center; width: 100%;">
            Page <span class="pageNumber"></span> of <span class="totalPages"></span>
          </div>
        `;
      }

      console.log(chalk.yellow(`📄 Converting: ${input} → ${output}`));
      await converter.convertFileToPDF(input, output, pdfOptions);
      
    } catch (error) {
      console.error(chalk.red(`💥 Conversion failed: ${error.message}`));
      process.exit(1);
    } finally {
      await converter.close();
    }
  });

program
  .command('url')
  .description('Convert URL to PDF')
  .argument('<url>', 'URL to convert')
  .argument('<output>', 'Output PDF file path')
  .option('-f, --format <format>', 'PDF format (A4, A3, Letter, Legal)', 'A4')
  .option('-m, --margin <margin>', 'PDF margins', '1cm')
  .option('--no-background', 'Disable background graphics')
  .option('--delay <ms>', 'Delay before PDF generation', '2000')
  .action(async (url, output, options) => {
    const converter = new HTMLToPDFConverter();
    
    try {
      await converter.initialize();
      const page = await converter.browser.newPage();
      
      console.log(chalk.yellow(`🌐 Loading URL: ${url}`));
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      
      if (options.delay) {
        await page.waitForTimeout(parseInt(options.delay));
      }

      const pdfOptions = {
        format: options.format,
        printBackground: options.background !== false,
        margin: options.margin
      };

      await page.pdf({
        path: output,
        ...pdfOptions
      });

      console.log(chalk.green(`✅ PDF generated successfully: ${output}`));
      
    } catch (error) {
      console.error(chalk.red(`💥 Conversion failed: ${error.message}`));
      process.exit(1);
    } finally {
      await converter.close();
    }
  });

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

// If no command is provided, show help
if (process.argv.length <= 2) {
  program.help();
}

program.parse();
