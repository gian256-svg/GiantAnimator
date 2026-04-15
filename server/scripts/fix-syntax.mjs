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
            if (file.endsWith('.tsx')) {
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

    // 1. Fix destructuring with default value of T.background (invalid syntax)
    // Example: backgroundColor ?? T.background,
    const destructuringPattern = /,\s*backgroundColor\s*\?\?\s*T\.background\s*,/g;
    if (destructuringPattern.test(content)) {
        content = content.replace(destructuringPattern, ',\n  backgroundColor,');
        changed = true;
    }
    
    // Also handle if it's the last item
    const destructuringPatternLast = /,\s*backgroundColor\s*\?\?\s*T\.background\s*\n\}\)\s*=>/g;
    if (destructuringPatternLast.test(content)) {
        content = content.replace(destructuringPatternLast, ',\n  backgroundColor,\n}) =>');
        changed = true;
    }

    // 2. Fix style objects with shorthand ?? which is invalid
    // Example: style={{ backgroundColor ?? T.background }}
    const stylePattern = /style=\{\{\s*backgroundColor\s*\?\?\s*T\.background\s*\}\}/g;
    if (stylePattern.test(content)) {
        content = content.replace(stylePattern, 'style={{ backgroundColor: backgroundColor ?? T.background }}');
        changed = true;
    }

    // Handle when it has other props: style={{ backgroundColor ?? T.background, ... }}
    const stylePatternMulti = /style=\{\{\s*backgroundColor\s*\?\?\s*T\.background\s*,/g;
    if (stylePatternMulti.test(content)) {
        content = content.replace(stylePatternMulti, 'style={{ backgroundColor: backgroundColor ?? T.background, ');
        changed = true;
    }
    
    // 3. Fix duplicate backgroundColor in Props interface
    const propInterfacePattern = /interface\s+\w+Props\s*\{[\s\S]*?\}/g;
    content = content.replace(propInterfacePattern, (match) => {
        if (match.match(/backgroundColor\?: string;/g)?.length > 1) {
            changed = true;
            return match.replace(/backgroundColor\?: string;/g, '@@@BG@@@').replace('@@@BG@@@', 'backgroundColor?: string;').replace(/@@@BG@@@\s*\n?/g, '');
        }
        return match;
    });

    if (changed) {
        console.log(`Fixed ${file}`);
        fs.writeFileSync(file, content);
    }
});
