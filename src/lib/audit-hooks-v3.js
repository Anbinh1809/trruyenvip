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

const IGNORES = ['node_modules', '.next', '.git'];

walk('src', (filePath) => {
    if (IGNORES.some(i => filePath.includes(i))) return;
    if (!filePath.match(/\.(js|jsx|ts|tsx)$/)) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Look for useEffect usage
    const hasUseEffect = /\buseEffect\b/.test(content);
    const hasUseState = /\buseState\b/.test(content);
    
    if (hasUseEffect || hasUseState) {
        const hasDirectImport = /import\s+{[^}]*\b(useEffect|useState)\b[^}]*}\s+from\s+['"]react['"]/.test(content);
        const hasReactImport = /import\s+React\b/.test(content);
        
        if (!hasDirectImport && !hasReactImport) {
            console.log(`[ALERT] ${filePath}: Missing React import for hooks!`);
        }
    }
});
