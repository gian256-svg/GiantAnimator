import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PATHS } from './paths.js';

// ✅ Voltando para o local centralizado, longe do cache do servidor
const HISTORY_FILE = path.join(PATHS.root, 'history.json');

console.log(`📂 [HISTORY] Ponto de persistência final: ${HISTORY_FILE}`);

export interface Job {
    id: string;
    filename: string;
    outputFile: string;
    status: 'processing' | 'done' | 'error';
    duration?: number;
    props?: any;
    createdAt: string;
}

// ✅ Função de carga com trava de segurança contra "Amnésia"
function loadJobs(): Job[] {
    try {
        if (!fs.existsSync(HISTORY_FILE)) {
            console.log('📂 [HISTORY] Arquivo não existe ainda. Iniciando vazio.');
            return [];
        }
        
        const raw = fs.readFileSync(HISTORY_FILE, 'utf-8').trim();
        if (!raw) return [];
        
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            console.warn('⚠️ [HISTORY] Arquivo corrompido ou inválido. Ignorando para evitar perda de dados.');
            return [];
        }
        
        return parsed;
    } catch (err: any) {
        console.error('❌ [HISTORY] Erro crítico ao ler histórico:', err.message);
        // Retornamos um array vazio mas com um aviso, para não apagar nada se viermos de um erro de leitura
        return [];
    }
}

// ✅ Salvamento robusto com persistência física garantida
function saveJobs(jobs: Job[]): void {
    if (!jobs) return;
    
    try {
        const dir = path.dirname(HISTORY_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        // Escrita síncrona
        const data = JSON.stringify(jobs, null, 2);
        const fd = fs.openSync(HISTORY_FILE, 'w');
        fs.writeSync(fd, data);
        fs.fsyncSync(fd); // Força o Windows a gravar no disco físico
        fs.closeSync(fd);

        console.log(`💾 [HISTORY] ${jobs.length} job(s) salvos e sincronizados no disco.`);
    } catch (err: any) {
        console.error('❌ [HISTORY] Erro fatal ao persistir dados:', err.message);
    }
}

export function addJob(data: Omit<Job, 'id' | 'createdAt'>): Job {
    const jobs = loadJobs();
    const job: Job = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    jobs.unshift(job);
    if (jobs.length > 50) jobs.splice(50);
    saveJobs(jobs);
    return job;
}

export function getHistory(): Job[] {
    return loadJobs();
}

export function getJobById(id: string): Job | undefined {
    return loadJobs().find(j => j.id === id);
}

export function updateJobStatus(
    id: string,
    status: Job['status'],
    outputFile?: string
): Job | undefined {
    const jobs = loadJobs();
    const idx = jobs.findIndex(j => j.id === id);
    if (idx === -1) return undefined;
    
    jobs[idx].status = status;
    if (outputFile) jobs[idx].outputFile = outputFile;
    
    saveJobs(jobs);
    return jobs[idx];
}

export function clearHistory(): void {
    saveJobs([]);
}
