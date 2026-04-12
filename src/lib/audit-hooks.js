import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
};

console.log('--- [Titan Auditor] Scanning for Hook Regressions ---');

walk('src', (filePath) => {
    if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for useEffect usage
    if (/\buseEffect\b/.test(content)) {
         const hasImport = /import\s+\{.*?\buseEffect\b.*?\}\s+from\s+['"]react['"]/s.test(content);
         const hasReactImport = /import\s+React\s+from\s+['"]react['"]/.test(content);
         const isReactGlobal = /React\.useEffect/.test(content);

         if (!hasImport && !isReactGlobal) {
             console.log(`[FAIL] ${filePath}: Uses useEffect but it is NOT invited to the party!`);
         }
    }
});

console.log('--- [Titan Auditor] Scan Complete ---');
