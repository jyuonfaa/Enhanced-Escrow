const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/hp/Desktop/enhanced-escrow/backend';
const filesToDelete = ['({e', '{"'];

filesToDelete.forEach(file => {
    const fullPath = path.join(dir, file);
    try {
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`Deleted: ${file}`);
        } else {
            console.log(`Not found: ${file}`);
        }
    } catch (err) {
        console.error(`Error deleting ${file}:`, err.message);
    }
});
