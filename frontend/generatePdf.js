import puppeteer from 'puppeteer-core';
import fs from 'fs';

(async () => {
    try {
        const browser = await puppeteer.launch({
            executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
            headless: 'new'
        });
        const page = await browser.newPage();
        
        const html = fs.readFileSync('c:/Users/hp/Desktop/CSlim/enhanced-escrow/enhanced-escrow/FINAL_YEAR_PROJECT_DOCUMENTATION.html', 'utf8');
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        await page.pdf({
            path: 'c:/Users/hp/Desktop/CSlim/enhanced-escrow/enhanced-escrow/FINAL_YEAR_PROJECT_DOCUMENTATION.pdf',
            format: 'A4',
            displayHeaderFooter: true,
            headerTemplate: '<div style="font-size:10px; width:100%; text-align:center;"></div>',
            footerTemplate: '<div style="font-size:10px; width:100%; text-align:center;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
            margin: { top: '40px', bottom: '60px', left: '40px', right: '40px' },
            printBackground: true
        });
        
        await browser.close();
        console.log('PDF generated successfully!');
    } catch (e) {
        console.error('Error generating PDF:', e);
    }
})();
