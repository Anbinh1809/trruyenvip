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

console.log('--- [Titan Hook Auditor] Scanning ---');

walk('src', (filePath) => {
    if (!filePath.endsWith('.js')) return;
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for useEffect usage
    if (content.includes('useEffect')) {
        const importMatch = content.match(/import\s+({[^}]*})\s+from\s+['"]react['"]/s);
        if (importMatch) {
            const imports = importMatch[1];
            if (!imports.includes('useEffect')) {
                console.log(`[FAIL] ${filePath}: Uses useEffect but only imports ${imports}`);
            }
        } else if (!content.includes('React.useEffect') && !content.includes('import React')) {
             console.log(`[ALERT] ${filePath}: Uses useEffect but has NO react import!`);
        }
    }
});
console.log('--- Scan Complete ---');
