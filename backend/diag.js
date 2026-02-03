const fs = require('fs');
const dir = '.';

const items = fs.readdirSync(dir);
items.forEach(item => {
    console.log(`Item: [${item}] Length: ${item.length} CharCodes: ${[...item].map(c => c.charCodeAt(0)).join(',')}`);
});
