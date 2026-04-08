import { Response } from 'express';

const clients: Set<Response> = new Set();

/**
 * Adiciona um novo cliente SSE.
 */
export function addClient(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  clients.add(res);

  // Keep-alive heartbeat
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  res.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
    console.log('🔌 [SSE] Cliente desconectado');
  });

  console.log(`🔌 [SSE] Novo cliente conectado (total: ${clients.size})`);
}

/**
 * Envia um evento para todos os clientes conectados.
 */
export function broadcast(data: object) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(res => {
    try {
      res.write(payload);
    } catch (err) {
      console.warn('⚠️ [SSE] Erro ao enviar para cliente, removendo...');
      clients.delete(res);
    }
  });
}
