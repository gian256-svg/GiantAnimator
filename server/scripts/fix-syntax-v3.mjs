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

    // 1. Fix data: { ... r: number theme?: string; (missing closure)
    // Note: the whitespace after 'number' can be multiple spaces
    const brokenClosurePattern = /data:\s*\{\s*(.*?)\s+theme\?:/g;
    if (brokenClosurePattern.test(content)) {
        content = content.replace(/(data:\s*\{\s*.*?)\s+theme\?:/g, '$1 }\n  theme?:');
        changed = true;
    }

    // 2. Fix the theme ?? 'dark' when theme is missing from props
    // We already fixed some, but let's be sure
    if (content.includes('resolveTheme(theme ??') && !content.match(/\{\s*[\s\S]*?theme[\s\S]*?\}/)) {
        // If theme is used in resolveTheme but not destructured, add it
        content = content.replace(/React\.FC<(\w+)>\s*=\s*\(\{/g, 'React.FC<$1> = ({\n  theme = "dark",');
        changed = true;
    }

    if (changed) {
        console.log(`Fixed ${file}`);
        fs.writeFileSync(file, content);
    }
});
