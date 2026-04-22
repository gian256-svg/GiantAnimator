/* ═══════════════════════════════════════════════════════════════
   APP LOGIC — GiantAnimator
═══════════════════════════════════════════════════════════════ */

const state = {
  files: [],
  history: [],
  currentVideo: null,
  isRendering: false,
  eventSource: null,
  currentJobId: null,
  uploadMode: 'vision', // 'vision' ou 'data'
  currentAnalysis: null,
  originalFilename: null
};

function updateUploadUI() {
  const dz = document.getElementById('drop-zone');
  if (!dz) return;
  const hint = document.getElementById('drop-hint') || dz.querySelector('.drop-hint');
  const text = dz.querySelector('.drop-text');
  const fileInput = document.getElementById('file-input');
  
  const btnVision = document.getElementById('btn-mode-vision');
  const btnData = document.getElementById('btn-mode-data');

  if (btnVision) btnVision.classList.toggle('active', state.uploadMode === 'vision');
  if (btnData) btnData.classList.toggle('active', state.uploadMode === 'data');

  if (state.uploadMode === 'vision') {
    if (text) text.textContent = 'Arraste uma referência visual ou clique';
    if (hint) hint.textContent = 'Formatos: PNG · JPG · JPEG · WEBP';
    if (fileInput) fileInput.accept = '.png,.jpg,.jpeg,.webp';
    log("🎨 Modo: Referência Visual ativado.");
  } else {
    if (text) text.textContent = 'Arraste sua planilha ou clique';
    if (hint) hint.textContent = 'Formatos: XLSX · CSV · XLS · JSON';
    if (fileInput) fileInput.accept = '.xlsx,.xls,.csv,.json';
    log("📊 Modo: Dados Diretos ativado.");
  }
}

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

function updateStatus(text, state) {
    const dot = document.getElementById('status-dot');
    const label = document.getElementById('status-text');
    if (!dot || !label) return;
    
    label.textContent = text;
    dot.className = 'status-dot'; // Reset
    if (state === 'error') dot.classList.add('error');
    if (state === 'processing') dot.classList.add('processing');
    if (state === 'idle') dot.classList.add('idle');
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
  const files = Array.from(fileList);
  
  files.forEach(file => {
    const ext = file.name.split('.').pop().toLowerCase();
    const isImage = ['png','jpg','jpeg','webp'].includes(ext);
    const isData = ['xlsx','xls','csv','json'].includes(ext);

    // Validação de Modo
    if (state.uploadMode === 'vision' && !isImage) {
        toast(`O modo atual é IMAGEM. "${file.name}" não é suportado aqui.`, 'error');
        return;
    }
    if (state.uploadMode === 'data' && !isData) {
        toast(`O modo atual é DADOS. "${file.name}" não é uma planilha válida.`, 'error');
        return;
    }

    state.files.push({ id: uid(), file, name: file.name, size: file.size, status: 'pending' });
    log(`📎 Arquivo adicionado: ${file.name}`);
  });
  
  renderFileQueue();
  
  // Se for modo de dados, força a visualização do preview do primeiro arquivo compatível
  if (state.uploadMode === 'data') {
    const firstTable = files.find(f => f.name.match(/\.(csv|xlsx|xls|json)$/i));
    if (firstTable) {
        loadCSVPreview(firstTable);
    }
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

  const RAINBOW = [
    '#F87171', '#FB923C', '#FBBF24', '#34D399', '#22D3EE', 
    '#60A5FA', '#818CF8', '#A78BFA', '#F472B6'
  ];

  try {
    const fd = new FormData();
    fd.append('file', file);
    
    // Chamada unificada para o novo endpoint /preview-data
    console.log('📡 [Fetch] Enviando para /preview-data...');
    const res = await fetch('/preview-data', { method: 'POST', body: fd });
    
    if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ [Fetch] Erro:', res.status, errorText);
        throw new Error(`Servidor retornou ${res.status}: ${errorText || 'Falha ao analisar arquivo'}`);
    }
    
    const data = await res.json();
    console.log('✅ [Fetch] Dados recebidos:', data);
    const summary = data.summary;

    // Meta Info
    const metaHtml = `
      <div class="csv-meta-badge accent">${summary.totalCols} Colunas</div>
      <div class="csv-meta-badge ok">${summary.totalRows} Linhas</div>
      <div class="csv-meta-badge">Delimitador: ${data.detectedDelimiter || 'Auto'}</div>
      <div class="csv-meta-badge">Formato: ${data.shape === 'wide' ? 'Wide (Múltiplas séries)' : 'Long (Série simples)'}</div>
    `;
    document.getElementById('csv-meta-info').innerHTML = metaHtml;

    // Mapeamento de cores por coluna
    const colColors = {};
    data.headers.forEach((h, i) => {
      colColors[h] = RAINBOW[i % RAINBOW.length];
    });

    let colsHtml = '';
    data.headers.forEach(h => {
        const isNum = summary.numericColumns.includes(h);
        const color = colColors[h];
        colsHtml += `
          <div class="csv-col-chip" style="border-color: ${color}44; background: ${color}15; color: ${color}">
            <span class="chip-type" style="opacity: 0.6">${isNum ? 'NUM' : 'TEXT'}</span>
            ${h}
          </div>`;
    });
    document.getElementById('csv-cols-row').innerHTML = colsHtml;

    // Tabela Amostra
    let sampleHtml = '<thead><tr>';
    data.headers.forEach(h => {
      const color = colColors[h];
      sampleHtml += `<th style="color: ${color}; border-bottom: 2px solid ${color}33;">${h}</th>`;
    });
    sampleHtml += '</tr></thead><tbody>';

    summary.sample.forEach(row => {
      sampleHtml += '<tr>';
      data.headers.forEach(h => {
        const val = row[h] !== undefined && row[h] !== null ? row[h] : '';
        const isNum = summary.numericColumns.includes(h);
        const color = colColors[h];
        sampleHtml += `<td class="${isNum ? 'col-num' : ''}" style="color: ${isNum ? color : 'inherit'}" title="${val}">${val}</td>`;
      });
      sampleHtml += '</tr>';
    });
    sampleHtml += '</tbody>';
    document.getElementById('csv-sample-table').innerHTML = sampleHtml;

    document.getElementById('csv-suggestion').innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
      Estrutura <strong>${data.shape}</strong> identificada. Mapeamento de dados 4K pronto.
    `;

  } catch (err) {
    document.getElementById('csv-meta-info').innerHTML = `<div class="csv-meta-badge accent">Erro ao prever estrutura: ${err.message}</div>`;
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
  const btnVision = document.getElementById('btn-mode-vision');
  const btnData = document.getElementById('btn-mode-data');

  if (btnVision && btnData) {
    btnVision.addEventListener('click', () => { state.uploadMode = 'vision'; updateUploadUI(); });
    btnData.addEventListener('click', () => { state.uploadMode = 'data'; updateUploadUI(); });
  }

  if (dz && fi) {
    dz.addEventListener('click', () => fi.click());
    fi.addEventListener('change', e => {
        addFiles(e.target.files);
        fi.value = ''; // Reset para permitir subir o mesmo arquivo
    });
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
    dz.addEventListener('dragleave', () => { dz.classList.remove('drag-over'); });
    dz.addEventListener('drop', e => { 
        e.preventDefault(); 
        dz.classList.remove('drag-over'); 
        addFiles(e.dataTransfer.files); 
    });
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

  // ─── JSON MODAL & VISUAL EDITOR ELEMENTS ────────────────
  const modal = document.getElementById('json-editor-overlay');
  const btnConfirmJson = document.getElementById('btn-confirm-json');
  const btnCloseJson = document.getElementById('btn-close-json');
  const btnCancelJson = document.getElementById('btn-cancel-json');

  const closeModal = () => { if (modal) modal.style.display = 'none'; state.isRendering = false; renderFileQueue(); };
  if (btnCloseJson) btnCloseJson.addEventListener('click', closeModal);
  if (btnCancelJson) btnCancelJson.addEventListener('click', closeModal);

  // ─── VISUAL EDITOR PREMIUM — Split Panel + Live Preview ──────────
  window.renderVisualEditor = function(analysis) {
    const container = document.getElementById('visual-editor-container');
    if (!container) return;

    const props = analysis.props || {};
    const labels = props.labels || [];
    const series = props.series || (props.datasets ? props.datasets : []);
    const detectedType = analysis.componentId || 'BarChart';

    // Normaliza dados para o editor
    let dataPoints = [];
    if (series.length > 0) {
      labels.forEach((label, i) => {
        dataPoints.push({ label: label || `Item ${i+1}`, value: Number(series[0].data?.[i] ?? 0) });
      });
    } else if (props.data && props.data.length > 0) {
      dataPoints = props.data.map(d => ({ label: d.label, value: Number(d.value) }));
    }
    if (dataPoints.length === 0) {
      dataPoints = [{ label: 'Categoria 1', value: 0 }];
    }

    // Gera HTML inicial do editor
    container.innerHTML = `
      <div class="ve-split">
        <!-- PAINEL ESQUERDO: Metadados + Grid -->
        <div class="ve-left">
          <div class="ve-meta">
            <div class="ve-field">
              <label class="ve-label">Título</label>
              <input type="text" id="edit-title" class="ve-input" value="${(props.title||'').replace(/"/g,'&quot;')}" placeholder="Título do gráfico...">
            </div>
            <div class="ve-field">
              <label class="ve-label">Subtítulo / Insight</label>
              <input type="text" id="edit-subtitle" class="ve-input" value="${(props.subtitle||'').replace(/"/g,'&quot;')}" placeholder="Insight ou fonte dos dados...">
            </div>

            <!-- TYPE SWITCHER (Restaurado) -->
            <div class="ve-field">
              <label class="ve-label">Tipo de Gráfico</label>
              <div class="ve-type-switcher" id="ve-type-switcher">
                <button class="ve-type-btn ${detectedType === 'BarChart' ? 'active' : ''}" data-type="BarChart" title="Bar Chart (Vertical)">📊</button>
                <button class="ve-type-btn ${detectedType === 'HorizontalBarChart' ? 'active' : ''}" data-type="HorizontalBarChart" title="Horizontal Bar">➖</button>
                <button class="ve-type-btn ${detectedType === 'LineChart' ? 'active' : ''}" data-type="LineChart" title="Line Chart">📈</button>
                <button class="ve-type-btn ${detectedType === 'PieChart' ? 'active' : ''}" data-type="PieChart" title="Pie Chart">⭕</button>
                <button class="ve-type-btn ${detectedType === 'ComparativeBarChart' ? 'active' : ''}" data-type="ComparativeBarChart" title="Comparative Bar">⚖️</button>
              </div>
            </div>

                  <div class="setting-item">
                    <span>Background Escuro</span>
                    <label class="switch">
                      <input type="checkbox" id="edit-dark-mode" checked>
                      <span class="slider round"></span>
                    </label>
                  </div>
                  <div class="setting-item">
                    <span>Motor de Render</span>
                    <select id="edit-engine" class="engine-select">
                      <option value="remotion">Remotion (4K UHD)</option>
                      <option value="hyperframes">Hyperframes (HTML/GSAP)</option>
                    </select>
                  </div>
          </div>

          <div class="ve-grid-header">
            <span class="ve-label">Dados</span>
            <button class="ve-add-row" id="ve-add-row">+ Linha</button>
          </div>
          <div class="ve-grid-wrap">
            <table class="ve-grid" id="ve-grid">
              <thead><tr><th>CATEGORIA</th><th>VALOR</th><th></th></tr></thead>
              <tbody id="ve-grid-body"></tbody>
            </table>
          </div>
        </div>

        <!-- PAINEL DIREITO: Preview live -->
        <div class="ve-right">
          <div class="ve-preview-label">Preview ao Vivo</div>
          <div class="ve-preview-title" id="ve-preview-title">${props.title || 'Sem título'}</div>
          <div class="ve-preview-subtitle" id="ve-preview-subtitle">${props.subtitle || ''}</div>
          <div class="ve-chart-wrap">
            <svg id="ve-chart-svg" width="100%" height="220" viewBox="0 0 360 220"></svg>
          </div>
        </div>
      </div>
    `;

    // ── Estado interno do editor ──────────────────────────────────────
    let editorData  = dataPoints.map(d => ({ ...d }));
    let editorType  = detectedType;
    // Expose type getter so confirm button can read it
    container._getEditorType = () => editorType;

    // ── Renderiza as linhas da grid ───────────────────────────────────
    function renderGrid() {
      const tbody = document.getElementById('ve-grid-body');
      if (!tbody) return;
      tbody.innerHTML = editorData.map((dp, i) => `
        <tr class="ve-row" data-idx="${i}">
          <td><input type="text" class="ve-cell ve-cell-label" data-idx="${i}" value="${dp.label.replace(/"/g,'&quot;')}" placeholder="Label..."></td>
          <td><input type="number" step="any" class="ve-cell ve-cell-value" data-idx="${i}" value="${dp.value}"></td>
          <td><button class="ve-del-row" data-idx="${i}" title="Remover">×</button></td>
        </tr>
      `).join('');

      // Eventos das células
      tbody.querySelectorAll('.ve-cell-label').forEach(inp => {
        inp.addEventListener('input', e => {
          editorData[e.target.dataset.idx].label = e.target.value;
          updatePreview();
        });
      });
      tbody.querySelectorAll('.ve-cell-value').forEach(inp => {
        inp.addEventListener('input', e => {
          editorData[e.target.dataset.idx].value = parseFloat(e.target.value) || 0;
          updatePreview();
        });
      });
      tbody.querySelectorAll('.ve-del-row').forEach(btn => {
        btn.addEventListener('click', e => {
          const idx = parseInt(e.target.dataset.idx);
          if (editorData.length > 1) {
            editorData.splice(idx, 1);
            renderGrid();
            updatePreview();
          }
        });
      });
    }

    // ── Desenha o mini-gráfico SVG (bar ou line ou pie) ──────────────
    function updatePreview() {
      const svg = document.getElementById('ve-chart-svg');
      const titleEl = document.getElementById('ve-preview-title');
      const subtitleEl = document.getElementById('ve-preview-subtitle');
      if (!svg) return;

      const titleVal = document.getElementById('edit-title')?.value || '';
      const subtitleVal = document.getElementById('edit-subtitle')?.value || '';
      if (titleEl) titleEl.textContent = titleVal || 'Sem título';
      if (subtitleEl) subtitleEl.textContent = subtitleVal;

      const W = 360, H = 220;
      const PAD_L = 48, PAD_R = 16, PAD_T = 10, PAD_B = 44;
      const plotW = W - PAD_L - PAD_R;
      const plotH = H - PAD_T - PAD_B;
      const values = editorData.map(d => d.value);
      const maxVal = Math.max(...values, 0.001);
      const minVal = Math.min(...values, 0);
      const COLORS = ['#7c3aed','#06b6d4','#a855f7','#22c55e','#f59e0b','#ef4444','#3b82f6','#f97316'];

      let paths = '';
      const n = editorData.length;

      if (editorType === 'PieChart') {
        // ── Pie ──
        const cx = W / 2, cy = H / 2 - 10, r = Math.min(plotW, plotH) / 2 - 10;
        const total = values.reduce((a,b) => a+b, 0) || 1;
        let angle = -Math.PI / 2;
        editorData.forEach((dp, i) => {
          const slice = (dp.value / total) * 2 * Math.PI;
          const endAngle = angle + slice;
          const x1 = cx + r * Math.cos(angle);
          const y1 = cy + r * Math.sin(angle);
          const x2 = cx + r * Math.cos(endAngle);
          const y2 = cy + r * Math.sin(endAngle);
          const lf = slice > Math.PI ? 1 : 0;
          const color = COLORS[i % COLORS.length];
          if (slice > 0) {
            paths += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${lf} 1 ${x2},${y2} Z" fill="${color}" stroke="#0f1117" stroke-width="1.5" opacity="0.92"/>`;
            // Label
            const midA = angle + slice / 2;
            const lx = cx + (r * 0.68) * Math.cos(midA);
            const ly = cy + (r * 0.68) * Math.sin(midA);
            if (slice > 0.3) paths += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-size="9" font-weight="700">${dp.label.slice(0,8)}</text>`;
          }
          angle = endAngle;
        });
        svg.innerHTML = paths;

      } else if (editorType === 'LineChart') {
        // ── Line ──
        const getX = i => PAD_L + (i / Math.max(n - 1, 1)) * plotW;
        const getY = v => PAD_T + plotH - ((v - minVal) / (maxVal - minVal || 1)) * plotH;
        const pts = editorData.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
        // Area
        const areaD = `M${getX(0)},${getY(editorData[0].value)} ` +
          editorData.slice(1).map((d,i)=>`L${getX(i+1)},${getY(d.value)}`).join(' ') +
          ` L${getX(n-1)},${PAD_T+plotH} L${getX(0)},${PAD_T+plotH} Z`;

        // Gridlines
        [0,0.5,1].forEach(v => {
          const y = PAD_T + plotH - v * plotH;
          const val = minVal + v * (maxVal - minVal);
          paths += `<line x1="${PAD_L}" y1="${y}" x2="${PAD_L+plotW}" y2="${y}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
          paths += `<text x="${PAD_L-4}" y="${y}" text-anchor="end" dominant-baseline="middle" fill="#666" font-size="8">${val >= 1000 ? (val/1000).toFixed(1)+'k' : Math.round(val)}</text>`;
        });
        paths += `<path d="${areaD}" fill="#7c3aed" opacity="0.12"/>`;
        paths += `<polyline points="${pts}" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
        editorData.forEach((d,i) => {
          paths += `<circle cx="${getX(i)}" cy="${getY(d.value)}" r="3" fill="#0f1117" stroke="#7c3aed" stroke-width="1.5"/>`;
          if (n <= 12) paths += `<text x="${getX(i)}" y="${PAD_T+plotH+12}" text-anchor="middle" fill="#666" font-size="8">${d.label.slice(0,6)}</text>`;
        });
        svg.innerHTML = paths;

      } else if (editorType === 'HorizontalBarChart') {
        // ── Horizontal Bar ──
        const barH = Math.min(plotH / n - 4, 22);
        const LABEL_W = 70;
        const bPlotW = plotW - LABEL_W;
        editorData.forEach((d, i) => {
          const y = PAD_T + i * (plotH / n) + (plotH / n - barH) / 2;
          const bW = (d.value / maxVal) * bPlotW;
          const color = COLORS[i % COLORS.length];
          paths += `<text x="${PAD_L + LABEL_W - 6}" y="${y + barH/2}" text-anchor="end" dominant-baseline="middle" fill="#94a3b8" font-size="9">${d.label.slice(0,10)}</text>`;
          paths += `<rect x="${PAD_L+LABEL_W}" y="${y}" width="${Math.max(bW,0)}" height="${barH}" fill="${color}" rx="2" opacity="0.85"/>`;
          if (bW > 25) paths += `<text x="${PAD_L+LABEL_W+bW-5}" y="${y+barH/2}" text-anchor="end" dominant-baseline="middle" fill="#fff" font-size="8" font-weight="700">${d.value >= 1000 ? (d.value/1000).toFixed(1)+'k' : d.value}</text>`;
        });
        svg.innerHTML = paths;

      } else {
        // ── Bar (default) ──
        const barW = Math.max(4, Math.min(plotW / n - 4, 44));
        const gap = (plotW - barW * n) / Math.max(n - 1, 1);

        // Gridlines
        [0, 0.5, 1].forEach(v => {
          const y = PAD_T + plotH - v * plotH;
          const val = v * maxVal;
          paths += `<line x1="${PAD_L}" y1="${y}" x2="${PAD_L+plotW}" y2="${y}" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>`;
          paths += `<text x="${PAD_L-4}" y="${y}" text-anchor="end" dominant-baseline="middle" fill="#555" font-size="8">${val >= 1000 ? (val/1000).toFixed(1)+'k' : Math.round(val)}</text>`;
        });

        editorData.forEach((d, i) => {
          const x = PAD_L + i * (barW + gap);
          const bH = (d.value / maxVal) * plotH;
          const y = PAD_T + plotH - bH;
          const color = COLORS[i % COLORS.length];
          paths += `<rect x="${x}" y="${y}" width="${barW}" height="${Math.max(bH,0)}" fill="${color}" rx="2" opacity="0.85"/>`;
          // Value on top
          if (bH > 12) paths += `<text x="${x+barW/2}" y="${y-3}" text-anchor="middle" fill="${color}" font-size="8" font-weight="700">${d.value >= 1000?(d.value/1000).toFixed(1)+'k':d.value}</text>`;
          // X label
          if (n <= 16) paths += `<text x="${x+barW/2}" y="${PAD_T+plotH+12}" text-anchor="middle" fill="#666" font-size="8">${d.label.slice(0,7)}</text>`;
        });
        svg.innerHTML = paths;
      }
    }

    // ── Botão Adicionar Linha ──────────────────────────────────────────
    document.getElementById('ve-add-row')?.addEventListener('click', () => {
      editorData.push({ label: `Item ${editorData.length + 1}`, value: 0 });
      renderGrid();
      updatePreview();
    });

    // ── Switcher de Tipo ──────────────────────────────────────────────
    document.getElementById('ve-type-switcher')?.querySelectorAll('.ve-type-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        editorType = e.target.dataset.type;
        // atualiza análise para o confirm usar
        analysis.componentId = editorType;
        document.querySelectorAll('.ve-type-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        updatePreview();
      });
    });

    // ── Atualização dos metadados ─────────────────────────────────────
    document.getElementById('edit-title')?.addEventListener('input', updatePreview);
    document.getElementById('edit-subtitle')?.addEventListener('input', updatePreview);

    // ── Inicializa ────────────────────────────────────────────────────
    renderGrid();
    updatePreview();

    // Expõe dados para o botão Confirmar (retrocompatibilidade total)
    container._getEditorData = () => editorData;
  }

  if (btnConfirmJson) {
      btnConfirmJson.addEventListener('click', async () => {
          try {
              const container = document.getElementById('visual-editor-container');
              const title    = document.getElementById('edit-title')?.value || '';
              const subtitle = document.getElementById('edit-subtitle')?.value || '';
              const isDarkBg = document.getElementById('edit-dark-mode')?.checked ?? true;
              const engine   = document.getElementById('edit-engine')?.value || 'remotion';

              // ── Novo Editor Premium ───────────────────────────────────────
              let newLabels = [], newData = [];
              if (container && typeof container._getEditorData === 'function') {
                  const editorData = container._getEditorData();
                  newLabels = editorData.map(d => d.label);
                  newData   = editorData.map(d => d.value);
              } else {
                  // Fallback para o editor antigo (caso alguma versão antiga ainda esteja no DOM)
                  document.querySelectorAll('.edit-label').forEach((input, i) => {
                      newLabels.push(input.value);
                      newData.push(parseFloat(document.querySelectorAll('.edit-value')[i]?.value) || 0);
                  });
              }

              // Reconstruir objeto de análise
              const editedAnalysis = JSON.parse(JSON.stringify(state.currentAnalysis));
              editedAnalysis.props.title    = title;
              editedAnalysis.props.subtitle = subtitle;
              editedAnalysis.props.labels   = newLabels;

              // Propaga o tipo de gráfico se o usuário trocou no switcher
              if (container && typeof container._getEditorType === 'function') {
                  editedAnalysis.componentId = container._getEditorType();
              }

              // Atualizar séries de dados
              if (editedAnalysis.props.series) {
                  editedAnalysis.props.series[0].data = newData;
              } else {
                  editedAnalysis.props.series = [{ label: title || 'Série 1', data: newData }];
              }
              if (editedAnalysis.props.data) {
                  editedAnalysis.props.data = newLabels.map((l, i) => ({ label: l, value: newData[i] }));
              }
              if (editedAnalysis.props.datasets) {
                  editedAnalysis.props.datasets[0].data = newData;
              }

              modal.style.display = 'none';
              log("⚙️ Enviando dados revisados para renderização final...");
              setProgress(55, "Gerando Vídeo...");
              
              const res = await fetch(`/jobs/${state.currentJobId}/start-render`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      analysis: editedAnalysis,
                      originalName: state.originalFilename,
                      chartTheme: document.getElementById('chart-theme')?.value || 'dark',
                      options: {
                        backgroundType: isDarkBg ? 'dark' : 'light',
                        engine: engine
                      },
                      includeCallouts: document.getElementById('toggle-callouts')?.checked || false
                  })
              });
              
              if (!res.ok) throw new Error("Falha ao iniciar renderização");
              
              toast("Renderização iniciada!", "success");
              startPolling(state.currentJobId, state.originalFilename, state.currentFileId);
          } catch (err) {
              toast("Erro ao processar dados: " + err.message, "error");
          }
      });
  }

  if (btnRender) {
    btnRender.addEventListener('click', async () => {
      const pending = state.files.filter(f => f.status === 'pending');
      if (!pending.length) return;
      state.isRendering = true;
      btnRender.disabled = true;

      try {
        for (const f of pending) {
          f.status = 'processing';
          state.currentFileId = f.id;
          state.originalFilename = f.name;
          renderFileQueue();
          
          const fd = new FormData();
          fd.append('file', f.file);

          fd.append('chartTheme', document.getElementById('chart-theme').value);
          
          fd.append('includeCallouts', document.getElementById('toggle-callouts').checked);
          fd.append('enableAuditor', document.getElementById('toggle-auditor').checked);
          fd.append('reviewRequired', true);

          log(`🚀 Enviando: ${f.name}`);
          const res = await fetch('/upload', { method: 'POST', body: fd });
          if (!res.ok) throw new Error(`Erro no upload: ${res.status}`);
          
          const data = await res.json();
          if (data.status === 'error') {
            stopPolling();
            const errorMsg = data.error || 'Erro desconhecido';
            const banner = document.getElementById('critical-error-banner');
            const bannerDesc = document.getElementById('error-banner-desc');

            if (errorMsg.includes('503') || errorMsg.includes('UNAVAILABLE')) {
                toast("⚠️ GEMINI OFFLINE 503", "error");
                updateStatus('GEMINI OFFLINE 503', 'error');
            } else if (errorMsg.includes('FIDELIDADE REPROVADA') || errorMsg.includes('BLANK')) {
                if (banner) {
                    banner.classList.remove('hidden');
                    bannerDesc.textContent = errorMsg;
                }
                toast("❌ FIDELIDADE REPROVADA", "error");
            } else {
                toast(`Erro: ${errorMsg}`, "error");
            }

            btnRender.disabled = false;
            btnRender.innerHTML = oldHtml;
            return;
          }
          
          // Reset banner if progressing
          document.getElementById('critical-error-banner').classList.add('hidden');
          startPolling(data.jobId, f.name, f.id);
        }
      } catch (err) {
        log(`✕ Erro: ${err.message}`, 'error');
        toast(`Erro no processamento: ${err.message}`, 'error');
        state.isRendering = false;
        renderFileQueue();
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
/* ═══════════════════════════════════════════════════════════════
   POLLING — Resiliência Total
═══════════════════════════════════════════════════════════════ */
function startPolling(jobId, fileName, fileId) {
  if (state.pollInterval) clearInterval(state.pollInterval);
  state.currentJobId = jobId;

  const interval = setInterval(async () => {
    try {
      const res = await fetch(`/progress/${jobId}`);
      if (!res.ok) return;

      const msg = await res.json();
      console.log('Polling Update:', msg);

      if (msg.progress !== undefined) {
        setProgress(msg.progress, msg.stage || '');
        if (msg.log) log(msg.log, msg.logType || 'info');
      }

      if (msg.status === 'awaiting_review') {
          clearInterval(interval);
          state.currentJobId = jobId;
          state.currentAnalysis = msg.analysis;
          
          // Open Modal & Render Visual Editor
          const modal = document.getElementById('json-editor-overlay');
          if (modal) {
              if (window.renderVisualEditor) window.renderVisualEditor(msg.analysis);
              modal.style.display = 'flex';
          }
          log("💉 Análise Surgery-Grade concluída. Aguardando revisão dos dados...");
          toast("Revisão de dados necessária", "info");
          return;
      }

      if (msg.status === 'done') {
        clearInterval(interval);
        state.isRendering = false;
        
        // Atualiza o status do arquivo na fila
        const file = state.files.find(f => f.id === fileId);
        if (file) file.status = 'done';
        
        setProgress(100, 'Vídeo 4K pronto ✓');
        log(`🎬 Vídeo UHD pronto: ${msg.videoUrl}`, 'success');
        toast('Renderização 4K concluída!', 'success');
        
        loadVideo(msg.videoUrl, fileName, msg.duration || '');
        triggerDownload(msg.videoUrl, fileName, jobId);
        
        renderFileQueue(); // Atualiza botão e lista
        refreshHistory();
      }

      if (msg.status === 'error') {
        clearInterval(interval);
        state.isRendering = false;
        
        const file = state.files.find(f => f.id === fileId);
        if (file) file.status = 'error';
        
        const errMsg = msg.error || 'Erro interno desconhecido do servidor';
        log(`✕ Erro 4K: ${errMsg}`, 'error');
        toast(`Erro: ${errMsg}`, 'error');
        setProgress(0, 'Erro ✕');
        
        renderFileQueue(); // Atualiza botão e lista
        // alert(`Status: ${errMsg}`); // Removido conforme solicitado para evitar interrupções
      }
    } catch(err) {
      console.error('Polling Error:', err);
    }
  }, 2000);

  state.pollInterval = interval;
}

/* ═══════════════════════════════════════════════════════════════
   SSE 4K
═══════════════════════════════════════════════════════════════ */
// SSE 4K removido — agora unificado no SSE principal em 4K

/* ═══════════════════════════════════════════════════════════════
   VIDEO PLAYER
═══════════════════════════════════════════════════════════════ */
function loadVideo(url, name, duration) {
  const video       = document.getElementById('preview-video');
  const placeholder = document.getElementById('player-placeholder');
  const meta        = document.getElementById('video-meta');

  if (!video) return;

  video.src = url;
  video.style.display = 'block';
  if (placeholder) placeholder.style.display = 'none';
  state.currentVideo = { url, name };

  if (duration && meta) meta.textContent = `⏱ ${duration}  ·  UHD 4K Video`;
}

function triggerDownload(url, filename, jobId) {
  const targetDir = document.getElementById('download-path')?.value;

  if (targetDir && targetDir.trim() !== '') {
    // Se há uma pasta pré-determinada, pede pro servidor salvar lá automaticamente
    fetch('/api/save-to-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, targetDir })
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        log(`💾 Salvo automaticamente em: ${data.path}`, 'success');
        toast('Vídeo salvo na pasta escolhida!', 'success');
      } else {
        throw new Error(data.error);
      }
    })
    .catch(err => {
      log(`⚠️ Erro ao salvar na pasta: ${err.message}. Iniciando download padrão...`, 'warn');
      // Fallback para download padrão do navegador
      standardDownload(url, filename);
    });
  } else {
    // Caso contrário, "popa a janela" (comportamento padrão do navegador)
    standardDownload(url, filename);
  }
}

function standardDownload(url, filename) {
  const cleanName = filename.replace(/\.[^.]+$/, '');
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${cleanName}_GiantAnimator_4K.mp4`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  toast('Download iniciado!', 'info');
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
