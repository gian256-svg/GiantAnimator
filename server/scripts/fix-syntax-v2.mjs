import fs from 'fs';
import path from 'path';

const dir = 'c:/Users/gianluca.palmisciano/.gemini/antigravity/scratch/GiantAnimator/remotion-project/src';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(dir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // 1. Fix value: number theme (missing closure)
    if (content.match(/value:\s*number\s+theme\?:/g)) {
        content = content.replace(/(value:\s*number)\s+(theme\?:)/g, '$1 }\n  $2');
        changed = true;
    }

    // 2. Fix invalid backgroundColor shorthand ?? in destructuring
    if (content.match(/,\s*backgroundColor\s*\?\?\s*T\.background\s*,/g)) {
        content = content.replace(/,\s*backgroundColor\s*\?\?\s*T\.background\s*,/g, ',\n  backgroundColor,');
        changed = true;
    }
    if (content.match(/,\s*backgroundColor\s*\?\?\s*T\.background\s*\n\}\)\s*=>/g)) {
        content = content.replace(/,\s*backgroundColor\s*\?\?\s*T\.background\s*\n\}\)\s*=>/g, ',\n  backgroundColor,\n}) =>');
        changed = true;
    }

    // 3. Fix invalid style shorthand backgroundColor ?? T.background
    if (content.match(/style=\{\{\s*backgroundColor\s*\?\?\s*T\.background\s*\}\}/g)) {
        content = content.replace(/style=\{\{\s*backgroundColor\s*\?\?\s*T\.background\s*\}\}/g, 'style={{ backgroundColor: backgroundColor ?? T.background }}');
        changed = true;
    }
    if (content.match(/style=\{\{\s*backgroundColor\s*\?\?\s*T\.background\s*,/g)) {
        content = content.replace(/style=\{\{\s*backgroundColor\s*\?\?\s*T\.background\s*,/g, 'style={{ backgroundColor: backgroundColor ?? T.background, ');
        changed = true;
    }

    // 4. Fix pop vs op or undefined pop
    if (content.includes('opacity={0.15 * pop}')) {
        content = content.replace('opacity={0.15 * pop}', 'opacity={0.15}');
        changed = true;
    }

    if (changed) {
        console.log(`Fixed ${file}`);
        fs.writeFileSync(file, content);
    }
});
