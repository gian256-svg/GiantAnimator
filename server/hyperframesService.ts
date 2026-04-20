
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { PATHS } from './paths.js';

const execPromise = promisify(exec);

export const hyperframesService = {
  /**
   * Renderiza uma composição Hyperframes a partir de um arquivo HTML ou conteúdo.
   */
  async render(
    config: {
      jobId: string;
      htmlContent?: string;
      sourceFile?: string;
      outputName: string;
      width?: number;
      height?: number;
    }
  ): Promise<string> {
    const projectRoot = path.join(PATHS.root, 'hyperframes-project');
    const tempDir = path.join(projectRoot, 'temp_builds');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const fileName = config.sourceFile || `job_${config.jobId}.html`;
    const fullPath = path.join(tempDir, fileName);

    if (config.htmlContent) {
      fs.writeFileSync(fullPath, config.htmlContent);
    }

    const outputPath = path.join(PATHS.output, config.outputName);
    const cmd = `npx hyperframes render "${fullPath}" -o "${outputPath}" --width ${config.width || 3840} --height ${config.height || 2160}`;

    console.log(`🎬 [HYPERFRAMES] Iniciando render: ${cmd}`);
    
    try {
      const { stdout, stderr } = await execPromise(cmd, { cwd: projectRoot });
      if (stderr && !stderr.includes('completed')) {
        console.warn(`⚠️ [HYPERFRAMES] Warning: ${stderr}`);
      }
      return outputPath;
    } catch (error) {
      console.error(`❌ [HYPERFRAMES] Falha no render:`, error);
      throw error;
    }
  }
};
