import fs from 'fs';
import path from 'path';

const USAGE_FILE = path.join(process.cwd(), 'usage.json');

export interface UsageStats {
  totalCalls: number;
  geminiTokens: number;
  groqTokens: number;
  ollamaCalls: number;
  estimatedCostUSD: number;
  lastUpdate: string;
}

export function logUsage(provider: 'gemini' | 'groq' | 'ollama', tokens: number = 0) {
  let stats: UsageStats = {
    totalCalls: 0,
    geminiTokens: 0,
    groqTokens: 0,
    ollamaCalls: 0,
    estimatedCostUSD: 0,
    lastUpdate: new Date().toISOString()
  };

  if (fs.existsSync(USAGE_FILE)) {
    try {
      stats = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf-8'));
    } catch (e) {
      // Reset if corrupt
    }
  }

  stats.totalCalls++;
  if (provider === 'gemini') {
    stats.geminiTokens += tokens;
    // Estimativa base: $0.075 / 1M tokens (Flash 2.5)
    stats.estimatedCostUSD += (tokens / 1000000) * 0.075;
  } else if (provider === 'groq') {
    stats.groqTokens += tokens;
    // Groq Llama 3.2 Vision é grátis por enquanto ou muito barato
  } else if (provider === 'ollama') {
    stats.ollamaCalls++;
  }

  stats.lastUpdate = new Date().toISOString();
  fs.writeFileSync(USAGE_FILE, JSON.stringify(stats, null, 2));
}

export function getUsage(): UsageStats {
  if (!fs.existsSync(USAGE_FILE)) {
    return { totalCalls: 0, geminiTokens: 0, groqTokens: 0, ollamaCalls: 0, estimatedCostUSD: 0, lastUpdate: new Date().toISOString() };
  }
  return JSON.parse(fs.readFileSync(USAGE_FILE, 'utf-8'));
}
