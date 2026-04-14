/* ═══════════════════════════════════════════════════════════════
   APP LOGIC — GiantAnimator
═══════════════════════════════════════════════════════════════ */

const state = {
  files: [],
  history: [],
  currentVideo: null,
  isRendering: false,
  eventSource: null,
  currentJobId: null
};

function uid() { return Math.random().toString(36).slice(2, 9); }

function fmt(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1048576).toFixed(1) + ' MB';
}

function now() {
  return new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
}

function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    el.style.transition = 'all 0.3s ease';
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

function log(msg, type = 'info') {
  const con = document.getElementById('log-console');
  if (!con) return;
  const line = document.createElement('div');
  line.className = `log-line ${type}`;
  line.innerHTML = `<span class="log-time">[${now()}]</span><span class="log-msg">${msg}</span>`;
  con.appendChild(line);
  con.scrollTop = con.scrollHeight;
}

function setProgress(pct, stage) {
  const bar = document.getElementById('progress-bar');
  const pctEl = document.getElementById('progress-pct');
  const stageEl = document.getElementById('progress-stage');
  
  if (bar) bar.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';
  if (stage && stageEl) stageEl.textContent = stage;
}

function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  // Return SVG paths — wrapped in .hist-thumb or .file-icon containers in HTML
  if (['xlsx','xls','csv'].includes(ext)) return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`;
  if (ext === 'json') return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
  if (['png','jpg','jpeg','webp'].includes(ext)) return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`;
}

function renderFileQueue() {
  const el = document.getElementById('file-queue');
  if (!el) return;
  if (!state.files.length) { el.innerHTML = ''; return; }
  el.innerHTML = state.files.map(f => `
    <div class="file-item">
      <div class="file-icon">${fileIcon(f.name)}</div>
      <div class="file-name">${f.name}</div>
      <div class="file-status ${f.status}">${f.status === 'pending' ? 'Aguardando' : f.status === 'processing' ? 'Processando...' : f.status === 'done' ? 'Concluído' : 'Erro'}</div>
      ${f.status === 'pending' ? `<button class="file-remove" onclick="removeFile('${f.id}')" title="Remover">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>` : ''}
    </div>
  `).join('');
  
  const btnRender = document.getElementById('btn-render');
  if (btnRender) {
    btnRender.disabled = !state.files.some(f => f.status === 'pending') || state.isRendering;
  }
}

window.removeFile = function(id) {
  state.files = state.files.filter(f => f.id !== id);
  renderFileQueue();
};

function addFiles(fileList) {
  Array.from(fileList).forEach(file => {
    state.files.push({ id: uid(), file, name: file.name, size: file.size, status: 'pending' });
    log(`📎 Arquivo adicionado: ${file.name}`);
  });
  renderFileQueue();
  
  // Se houver uma tabela (CSV/XLSX), força a visualização do preview
  const firstTable = Array.from(fileList).find(f => f.name.match(/\.(csv|xlsx|xls|ods)$/i));
  if (firstTable) {
    loadCSVPreview(firstTable);
  }
}

async function loadCSVPreview(file) {
  const panel = document.getElementById('csv-preview-panel');
  if (!panel) return;
  panel.style.display = 'flex';
  
  document.getElementById('csv-meta-info').innerHTML = '<div class="csv-meta-badge">Analisando estrutura...</div>';
  document.getElementById('csv-cols-row').innerHTML = '';
  document.getElementById('csv-sample-table').innerHTML = '';
  document.getElementById('csv-suggestion').innerHTML = '';

  try {
    // 1. Faz upload simples pra garantir que o arquivo esteja no servidor
    const fd = new FormData();
    fd.append('file', file);
    const uploadRes = await fetch('/api/upload-simple', { method: 'POST', body: fd });
    const { filename } = await uploadRes.json();

    // 2. Busca preview do arquivo
    const previewRes = await fetch(`/api/preview-csv?file=${encodeURIComponent(filename)}`);
    const data = await previewRes.json();

    if (!data.ok) throw new Error(data.error);

    // Meta Info
    const metaHtml = `
      <div class="csv-meta-badge accent">${data.totalCols} Colunas</div>
      <div class="csv-meta-badge ok">${data.totalRows} Linhas</div>
      <div class="csv-meta-badge">Delimitador: ${data.delimiterLabel}</div>
      <div class="csv-meta-badge">Formato: ${data.shape === 'wide' ? 'Wide (Múltiplas séries)' : 'Long (Série simples)'}</div>
    `;
    document.getElementById('csv-meta-info').innerHTML = metaHtml;

    // Colunas (Rainbow CSV style: azul para cat, verde para num)
    let colsHtml = '';
    data.categoricalColumns.forEach(c => {
      colsHtml += \`<div class="csv-col-chip categorical"><span class="chip-type">TEXT</span>\${c}</div>\`;
    });
    data.numericColumns.forEach(c => {
      colsHtml += \`<div class="csv-col-chip numeric"><span class="chip-type">NUM</span>\${c}</div>\`;
    });
    document.getElementById('csv-cols-row').innerHTML = colsHtml;

    // Tabela Amostra
    let sampleHtml = '<tr>';
    data.headers.forEach(h => {
      const isNum = data.numericColumns.includes(h);
      sampleHtml += \`<th class="\${isNum ? 'col-num' : 'col-cat'}">\${h}</th>\`;
    });
    sampleHtml += '</tr>';

    data.sample.forEach(row => {
      sampleHtml += '<tr>';
      data.headers.forEach(h => {
        const val = row[h] !== undefined && row[h] !== null ? row[h] : '';
        const isNum = data.numericColumns.includes(h);
        sampleHtml += \`<td class="\${isNum ? 'col-num' : ''}" title="\${val}">\${val}</td>\`;
      });
      sampleHtml += '</tr>';
    });
    document.getElementById('csv-sample-table').innerHTML = sampleHtml;

    // Sugere tipo de gráfico
    const chartTypeSelect = document.getElementById('chart-type');
    if (chartTypeSelect && data.suggestedChartType && chartTypeSelect.value === 'auto') {
      chartTypeSelect.value = data.suggestedChartType;
    }
    
    document.getElementById('csv-suggestion').innerHTML = \`
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
      A estrutura indica que sugerimos o gráfico: <strong>\${data.suggestedChartType}</strong>. Autoselecionado.
    \`;

  } catch (err) {
    document.getElementById('csv-meta-info').innerHTML = \`<div class="csv-meta-badge accent">Erro ao prever estrutura: \${err.message}</div>\`;
  }
}


function addClipboardImage(blob, index) {
  const name = `imagem_colada_${Date.now()}${index > 0 ? '_' + index : ''}.png`;
  const file = new File([blob], name, { type: blob.type || 'image/png' });
  state.files.push({ id: uid(), file, name: file.name, size: file.size, status: 'pending' });
  log(`📋 Imagem colada do clipboard: ${file.name}`);
  renderFileQueue();
}


// ─── DOM EVENTS ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const dz = document.getElementById('drop-zone');
  const fi = document.getElementById('file-input');
  const btnRender = document.getElementById('btn-render');
  const btnDownload4k = document.getElementById('btn-download4k');

  if (dz && fi) {
    dz.addEventListener('click', () => fi.click());
    fi.addEventListener('change', e => addFiles(e.target.files));
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.style.borderColor = '#111'; dz.style.backgroundColor = '#F0F0F0'; });
    dz.addEventListener('dragleave', () => { dz.style.borderColor = ''; dz.style.backgroundColor = ''; });
    dz.addEventListener('drop', e => { e.preventDefault(); dz.style.borderColor = ''; dz.style.backgroundColor = ''; addFiles(e.dataTransfer.files); });
  }

  // ─── CTRL+V / PASTE ────────────────────────────────────────
  document.addEventListener('paste', (e) => {
    if (!e.clipboardData) return;
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (!imageItems.length) return;

    e.preventDefault();

    // Flash visual no drop-zone
    if (dz) {
      dz.style.borderColor = '#111';
      dz.style.backgroundColor = '#F0F0F0';
      setTimeout(() => { dz.style.borderColor = ''; dz.style.backgroundColor = ''; }, 500);
    }

    imageItems.forEach((item, i) => {
      const blob = item.getAsFile();
      if (blob) addClipboardImage(blob, i);
    });

    toast('Imagem colada do clipboard!', 'success');
  });

  if (btnRender) {
    btnRender.addEventListener('click', async () => {
      const pending = state.files.filter(f => f.status === 'pending');
      if (!pending.length) return;
      state.isRendering = true;
      btnRender.disabled = true;

      for (const f of pending) {
        f.status = 'processing';
        renderFileQueue();
        const fd = new FormData();
        fd.append('file', f.file);
        fd.append('chartType', document.getElementById('chart-type').value);
        fd.append('chartTheme', document.getElementById('chart-theme').value);

        try {
          log(`🚀 Enviando: ${f.name}`);
          const res = await fetch('/upload', { method: 'POST', body: fd });
          const data = await res.json();
          startSSE(data.jobId, f.name);
          f.status = 'done';
          renderFileQueue();
        } catch (err) {
          f.status = 'error';
          renderFileQueue();
          log(`✕ Erro: ${err.message}`, 'error');
          state.isRendering = false;
        }
      }
    });
  }

  if (btnDownload4k) {
    btnDownload4k.addEventListener('click', async () => {
      const jobId = state.currentJobId;
      if (!jobId) { toast('Nenhuma animação carregada', 'warn'); return; }

      btnDownload4k.disabled = true;

      log('🔷 Solicitando render 4K...');
      toast('Render 4K iniciado! Aguarde...', 'info');

      try {
        const res = await fetch(`/render4k/${jobId}`, { method: 'POST' });
        const data = await res.json();

        if (data.status === 'ready' && data.video4kUrl) {
          log('✅ 4K já disponível — baixando...');
          triggerDownload4K(data.video4kUrl);
          btnDownload4k.disabled = false;
          return;
        }

        document.getElementById('render4k-overlay').style.display = 'flex';
        startSSE4K(jobId);
      } catch (err) {
        toast(`Erro ao iniciar 4K: ${err.message}`, 'error');
        btnDownload4k.disabled = false;
      }
    });
  }

  // Load history on start
  refreshHistory();
  // Status check
  setInterval(checkStatus, 10000);
  checkStatus();

  // ─── CLEAR HISTORY ─────────────────────────────────────────
  const btnClearHistory = document.getElementById('btn-clear-history');
  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', async () => {
      if (!confirm('Limpar todo o histórico?')) return;
      try {
        await fetch('/history/clear', { method: 'POST' });
        state.history = [];
        renderHistory();
        toast('Histórico limpo!', 'info');
        log('🗑 Histórico limpo.');
      } catch (err) {
        toast('Erro ao limpar histórico', 'error');
      }
    });
  }
});

/* ═══════════════════════════════════════════════════════════════
   SSE 720p
═══════════════════════════════════════════════════════════════ */
function startSSE(jobId, fileName) {
  if (state.eventSource) state.eventSource.close();

  const es = new EventSource(`/progress/${jobId}`);
  state.eventSource = es;
  state.currentJobId = jobId;

  es.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);

      if (msg.progress !== undefined) {
        setProgress(msg.progress, msg.stage || '');
        if (msg.log) log(msg.log, msg.logType || 'info');
      }

      if (msg.status === 'done') {
        es.close();
        state.isRendering = false;
        setProgress(100, 'Preview 720p pronto ✓');
        log(`🎬 Preview pronto: ${msg.videoUrl}`, 'success');
        toast('Preview 720p gerado!', 'success');
        loadVideo(msg.videoUrl, fileName, msg.duration || '');
        document.getElementById('btn-render').disabled = false;
        refreshHistory();
      }

      if (msg.status === 'error') {
        es.close();
        state.isRendering = false;
        log(`✕ Erro: ${msg.error}`, 'error');
        toast(`Erro: ${msg.error}`, 'error');
        setProgress(0, 'Erro ✕');
        document.getElementById('btn-render').disabled = false;
      }
    } catch(err) { /* ignore */ }
  };

  es.onerror = () => {
    log('⚠ Conexão SSE perdida', 'warn');
    es.close();
    state.isRendering = false;
    document.getElementById('btn-render').disabled = false;
  };
}

/* ═══════════════════════════════════════════════════════════════
   SSE 4K
═══════════════════════════════════════════════════════════════ */
function startSSE4K(jobId) {
  const es     = new EventSource(`/progress4k/${jobId}`);
  const bar    = document.getElementById('4k-bar');
  const pctEl  = document.getElementById('4k-pct');
  const stage  = document.getElementById('4k-stage');
  const overlay = document.getElementById('render4k-overlay');
  const btn    = document.getElementById('btn-download4k');

  es.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);

      if (msg.progress !== undefined) {
        if (bar) bar.style.width  = msg.progress + '%';
        if (pctEl) pctEl.textContent = msg.progress + '%';
        if (msg.stage && stage) stage.textContent = msg.stage;
        if (msg.log) log(msg.log, msg.logType || 'info');
      }

      if (msg.status === 'done') {
        es.close();
        if (overlay) overlay.style.display = 'none';
        log('🔷 Render 4K concluído! Baixando...', 'success');
        toast('Render 4K pronto! Iniciando download...', 'success');
        triggerDownload4K(msg.video4kUrl);
        btn.disabled = false;
      }

      if (msg.status === 'error') {
        es.close();
        if (overlay) overlay.style.display = 'none';
        log(`✕ Erro 4K: ${msg.error}`, 'error');
        toast(`Erro no render 4K: ${msg.error}`, 'error');
        btn.disabled = false;
      }
    } catch(err) { /* ignore */ }
  };

  es.onerror = () => {
    log('⚠ SSE 4K perdido', 'warn');
    es.close();
    if (overlay) overlay.style.display = 'none';
    btn.disabled = false;
  };
}

/* ═══════════════════════════════════════════════════════════════
   VIDEO PLAYER
═══════════════════════════════════════════════════════════════ */
function loadVideo(url, name, duration) {
  const video       = document.getElementById('preview-video');
  const placeholder = document.getElementById('player-placeholder');
  const meta        = document.getElementById('video-meta');
  const btn4k       = document.getElementById('btn-download4k');

  if (!video) return;

  video.src = url;
  video.style.display = 'block';
  if (placeholder) placeholder.style.display = 'none';
  state.currentVideo = { url, name };

  if (duration && meta) meta.textContent = `⏱ ${duration}  ·  720p preview`;

  if (btn4k) btn4k.disabled = false;
}

function triggerDownload4K(url) {
  const name = (state.currentVideo?.name || 'animacao').replace(/\.[^.]+$/, '');
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${name}_4K.mp4`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ═══════════════════════════════════════════════════════════════
   HISTORY
═══════════════════════════════════════════════════════════════ */
async function refreshHistory() {
  try {
    // Note: The server index.ts doesn't explicitly show a /history route in the first 100 lines, 
    // but the previous app.js used it. Let's assume it exists or the logic works with empty for now.
    // If it doesn't exist, we can implement it or just keep current session history.
    const res = await fetch('/history').catch(() => null);
    if (!res || !res.ok) {
        renderHistory();
        return;
    }
    const items = await res.json();
    state.history = items;
    renderHistory();
  } catch (err) { console.error(err); }
}

function renderHistory() {
  const el = document.getElementById('history-list');
  const countEl = document.getElementById('history-count');
  const clearBtn = document.getElementById('btn-clear-history');
  if (!el) return;

  if (countEl) countEl.textContent = `${state.history.length} / 10`;
  
  // Mostrar/esconder botão Limpar
  if (clearBtn) clearBtn.style.display = state.history.length > 0 ? 'flex' : 'none';

  if (!state.history.length) {
    el.innerHTML = '<div class="history-empty">Nenhuma animação gerada ainda</div>';
    return;
  }

  const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;

  el.innerHTML = state.history.map(h => `
    <div class="history-item" onclick="loadVideo('${h.videoUrl || '/output/'+h.outputFile}', '${h.filename || h.name}', '${h.duration || ''}')">
      <div class="hist-thumb">${fileIcon(h.filename || h.name)}</div>
      <div class="hist-info">
        <div class="hist-name">${h.filename || h.name}</div>
        <div class="hist-meta">${new Date(h.createdAt).toLocaleString('pt-BR')}</div>
      </div>
      <div class="hist-play">${playIcon}</div>
    </div>
  `).join('');
}

window.loadVideo = loadVideo; // expose to onclick

/* ═══════════════════════════════════════════════════════════════
   STATUS
═══════════════════════════════════════════════════════════════ */
async function checkStatus() {
  try {
    const res = await fetch('/health');
    const online = res.ok;
    const dot = document.getElementById('status-dot');
    const txt = document.getElementById('status-text');
    if (dot) dot.style.backgroundColor = online ? '#22C55E' : '#EF4444';
    if (txt) txt.textContent = online ? 'Servidor online' : 'Servidor offline';
  } catch {
    const dot = document.getElementById('status-dot');
    const txt = document.getElementById('status-text');
    if (dot) dot.style.backgroundColor = '#EF4444';
    if (txt) txt.textContent = 'Servidor offline';
  }
}
