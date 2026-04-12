import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
};

console.log('--- [Titan Auditor] Scanning for Import Regressions ---');

walk('src', (filePath) => {
    if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for useEffect usage
    if (content.includes('useEffect')) {
         const hasImport = content.includes('import') && content.includes('react');
         const hasUseEffectInImport = content.match(/import\s+{[^}]*\buseEffect\b[^}]*}\s+from\s+['"]react['"]/);
         const isReactGlobal = content.includes('React.useEffect');

         if (!hasUseEffectInImport && !isReactGlobal) {
             console.log(`[FAIL] ${filePath}: Uses useEffect but it is NOT invited to the party!`);
         }
    }
});

console.log('--- [Titan Auditor] Scan Complete ---');
