import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({
            executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
            headless: 'new'
        });
        const page = await browser.newPage();
        
        const htmlPath = 'c:/Users/hp/Desktop/CSlim/enhanced-escrow/enhanced-escrow/STUDENT_TESTING_GUIDE.html';
        const pdfPath = 'c:/Users/hp/Desktop/CSlim/enhanced-escrow/enhanced-escrow/STUDENT_TESTING_GUIDE.pdf';
        
        console.log('Reading HTML file...');
        const html = fs.readFileSync(htmlPath, 'utf8');
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        console.log('Generating PDF...');
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            displayHeaderFooter: true,
            headerTemplate: '<div style="font-size:10px; width:100%; text-align:center;"></div>',
            footerTemplate: '<div style="font-size:10px; width:100%; text-align:center; font-family: Inter, sans-serif; color: #64748b;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
            margin: { top: '40px', bottom: '60px', left: '40px', right: '40px' },
            printBackground: true
        });
        
        await browser.close();
        console.log('STUDENT_TESTING_GUIDE.pdf generated successfully!');
    } catch (e) {
        console.error('Error generating PDF:', e);
    }
})();
