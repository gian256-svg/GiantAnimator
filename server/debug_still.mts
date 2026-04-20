import { renderStill, selectComposition } from '@remotion/renderer';
import { bundle } from '@remotion/bundler';
import path from 'path';

const REMOTION_ROOT = path.join(process.cwd(), '..', 'remotion-project', 'src', 'index.ts');
const OUT = path.join(process.cwd(), 'test_still_debug.png');

async function main() {
  console.log('Bundling...');
  const bundleUrl = await bundle({ entryPoint: REMOTION_ROOT });
  console.log('Bundle ready, selecting composition...');
  
  const composition = await selectComposition({
    serveUrl: bundleUrl,
    id: 'LineChart',
    inputProps: {
      series: [
        { label: 'France', data: [100, 200, 300, 250, 400, 350, 500, 450, 600, 550], color: '#FF4500' },
        { label: 'Germany', data: [ 80, 150, 250, 200, 350, 300, 420, 380, 500, 480], color: '#FFD700' },
      ],
      labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct'],
      title: 'Test LineChart Debug',
      subtitle: 'Debug run',
      theme: 'volcano',
      bgStyle: 'none',
    }
  });
  
  composition.width = 1280;
  composition.height = 720;
  composition.durationInFrames = 600;
  
  console.log('Rendering still at frame 240...');
  await renderStill({
    composition,
    serveUrl: bundleUrl,
    output: OUT,
    frame: 240,
    inputProps: {
      series: [
        { label: 'France', data: [100, 200, 300, 250, 400, 350, 500, 450, 600, 550], color: '#FF4500' },
        { label: 'Germany', data: [ 80, 150, 250, 200, 350, 300, 420, 380, 500, 480], color: '#FFD700' },
      ],
      labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct'],
      title: 'Test LineChart Debug',
      subtitle: 'Debug run',
      theme: 'volcano',
      bgStyle: 'none',
    }
  });
  
  console.log('Still rendered to:', OUT);
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
