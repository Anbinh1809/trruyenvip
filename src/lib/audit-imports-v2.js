const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
};

const IGNORES = ['node_modules', '.next', '.git'];

walk('src', (filePath) => {
    if (IGNORES.some(i => filePath.includes(i))) return;
    if (!filePath.match(/\.(js|jsx|ts|tsx)$/)) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for useEffect usage
    if (/\buseEffect\b/.test(content)) {
        // Check for import
        const hasImport = /import\s+\{.*?\buseEffect\b.*?\}\s+from\s+['"]react['"]/.test(content);
        const hasReactGlobal = /React\.useEffect/.test(content);
        
        if (!hasImport && !hasReactGlobal) {
            console.log(`[FAIL] ${filePath}: Uses useEffect but missing import!`);
        }
    }
});
