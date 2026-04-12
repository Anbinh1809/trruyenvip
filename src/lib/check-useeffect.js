import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
};

console.log('--- [Titan Precision Scraper v2] Scanning ---');

walk('src', (filePath) => {
    if (!filePath.endsWith('.js')) return;
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Use /s flag for multi-line matching
    if (/\buseEffect\b/.test(content)) {
        const hasImport = /import\s+\{.*?\buseEffect\b.*?\}\s+from\s+['"]react['"]/s.test(content);
        const hasReactGlobal = /React\.useEffect/.test(content);
        
        if (!hasImport && !hasReactGlobal) {
            console.log(`[ALERT] ${filePath} is missing useEffect import!`);
        }
    }
});
console.log('--- Scan Complete ---');
