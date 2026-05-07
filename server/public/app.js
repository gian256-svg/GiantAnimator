/* ═══════════════════════════════════════════════════════════════
   APP LOGIC — GiantAnimator v2.0
   Equipe Apostólica: Pedro · João · Mateus · Tomé · André · Felipe
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
  originalFilename: null,
  selectedPalette: 'original',
  lastLogLength: 0, // rastreia quantos chars do log já foram exibidos
  zoomPoints: [],   // pontos de zoom cinematográfico (normalizados 0–1)
  stillUrl: null,   // URL do still do auditor — imagem fiel para seleção de pontos
  customPalette: {
    bg: '#0f1117',
    text: '#ffffff',
    bgType: 'dark',
    colors: ['#7c3aed', '#06b6d4', '#a855f7', '#22c55e', '#f59e0b', '#ef4444']
  }
};

const PALETTES = [
  { id: 'original', name: 'Referência', type: 'original', colors: ['#7c3aed', '#06b6d4', '#a855f7'], bg: '#070B12', bgType: 'dark' },
  { id: 'midnight', name: 'Midnight Orchid', colors: ['#8B5CF6', '#D946EF', '#6366F1', '#3B82F6'], bg: '#0f1117', bgType: 'dark' },
  { id: 'sunset', name: 'Sunset Warm', colors: ['#F59E0B', '#EF4444', '#F43F5E', '#8B5CF6'], bg: '#0f1117', bgType: 'dark' },
  { id: 'ocean', name: 'Ocean Deep', colors: ['#06B6D4', '#3B82F6', '#10B981', '#6366F1'], bg: '#FAF9F6', bgType: 'light' },
  { id: 'minimal', name: 'Minimal White', colors: ['#475569', '#64748B', '#94A3B8', '#CBD5E1'], bg: '#FAF9F6', bgType: 'light' },
  { id: 'corporate', name: 'Corporate Blue', colors: ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD'], bg: '#FAF9F6', bgType: 'light' },
  { id: 'cyber', name: 'Cyber Obsidian', colors: ['#F472B6', '#2DD4BF', '#818CF8', '#FB923C'], bg: '#050505', bgType: 'dark' },
  { id: 'neon', name: 'Neon Glow', colors: ['#FF00FF', '#00FFFF', '#FFFF00', '#00FF00'], bg: '#000000', bgType: 'dark' },
  { id: 'emerald', name: 'Emerald ESG', colors: ['#059669', '#10B981', '#34D399', '#6EE7B7'], bg: '#F0FDFA', bgType: 'light' },
  { id: 'volcano', name: 'Volcano Impact', colors: ['#DC2626', '#EA580C', '#F59E0B', '#B91C1C'], bg: '#0C0A09', bgType: 'dark' },
  { id: 'frost', name: 'Frost Clean', colors: ['#0EA5E9', '#38BDF8', '#7DD3FC', '#BAE6FD'], bg: '#F8FAFC', bgType: 'light' },
  { id: 'custom', name: 'Customizar', type: 'custom' }
];

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
    if (text) text.textContent = 'Arraste um GRÁFICO para analisar';
    if (hint) hint.textContent = 'Logos/Marcas? Use o botão "EDITAR CORES" abaixo.';
    if (fileInput) fileInput.accept = '.png,.jpg,.jpeg,.webp';
    log("Pedro: Modo Referência Visual (Gráficos) ativado.");
  } else {
    if (text) text.textContent = 'Arraste sua planilha ou clique';
    if (hint) hint.textContent = 'Formatos: XLSX · CSV · XLS · JSON';
    if (fileInput) fileInput.accept = '.xlsx,.xls,.csv,.json';
    log("Mateus: Modo Dados Diretos ativado.");
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

function renderPalettes() {
  const list = document.getElementById('palette-list');
  if (!list) return;

  list.innerHTML = PALETTES.map(p => {
    if (p.type === 'custom') {
      const isActive = state.selectedPalette === 'custom';
      const swatches = state.customPalette.colors.slice(0, 3).map(c => `<div class="swatch" style="background-color: ${c}"></div>`).join('');
      return `
        <div class="palette-item custom ${isActive ? 'active' : ''}" onclick="selectPalette('custom')">
          <div class="palette-bg-preview" style="background: ${state.customPalette.bg}">
            ${swatches}
          </div>
          <div class="palette-info">
            <span class="palette-name">Custom</span>
            <button class="palette-meta" onclick="event.stopPropagation(); openCustomPalette()" style="background:none;border:none;padding:0;color:var(--accent);cursor:pointer;text-align:left;">EDITAR CORES</button>
          </div>
        </div>
      `;
    }

    const isActive = state.selectedPalette === p.id;
    const swatches = p.colors.map(c => `<div class="swatch" style="background-color: ${c}"></div>`).join('');
    
    return `
      <div class="palette-item ${isActive ? 'active' : ''}" onclick="selectPalette('${p.id}')">
        <div class="palette-bg-preview" style="background: ${p.bg}">
          ${swatches}
        </div>
        <div class="palette-info">
          <span class="palette-name">${p.name}</span>
          <span class="palette-meta">${p.bgType === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
        </div>
      </div>
    `;
  }).join('');
}

window.selectPalette = function(id) {
  state.selectedPalette = id;
  const input = document.getElementById('chart-theme');
  if (input) input.value = id;
  renderPalettes();
  log(`André: Estilo "${id}" selecionado.`);
};

window.openCustomPalette = function() {
  const modal = document.getElementById('custom-palette-overlay');
  if (modal) {
    // Fill with current state
    document.getElementById('cp-bg').value = state.customPalette.bg;
    document.getElementById('cp-text').value = state.customPalette.text;
    document.getElementById('cp-bg-type').value = state.customPalette.bgType;
    
    const colorInputs = document.querySelectorAll('#cp-tab-manual .cp-color-input');
    state.customPalette.colors.forEach((c, i) => {
      if (colorInputs[i]) colorInputs[i].value = c;
    });

    // Reset tabs
    document.querySelectorAll('.cp-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.cp-tab[data-tab="manual"]').classList.add('active');
    document.querySelectorAll('.cp-tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('cp-tab-manual').classList.add('active');

    modal.style.display = 'flex';
  }
};

// ─── PALETTE TABS & REFERENCE LOGIC ────────────────────────────────
document.addEventListener('click', e => {
  if (e.target.classList.contains('cp-tab')) {
    const tabId = e.target.dataset.tab;
    document.querySelectorAll('.cp-tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    document.querySelectorAll('.cp-tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`cp-tab-${tabId}`).classList.add('active');
  }
});

// Handle Reference Image
document.addEventListener('DOMContentLoaded', () => {
    const cpDrop = document.getElementById('cp-ref-drop');
    const cpInput = document.getElementById('cp-ref-input');
    const canvas = document.getElementById('cp-ref-canvas');

    const cpReset = document.getElementById('cp-ref-reset');
    if (cpReset) {
        cpReset.addEventListener('click', () => {
            document.getElementById('cp-ref-preview-container').style.display = 'none';
            document.getElementById('cp-ref-drop').style.display = '';
            if (cpInput) cpInput.value = '';
        });
    }

    if (cpDrop && cpInput) {
        cpDrop.addEventListener('click', () => cpInput.click());
        cpInput.addEventListener('change', e => handlePaletteRefImage(e.target.files[0]));
        
        // Suporte para Drag & Drop de imagens na Referência Visual
        cpDrop.addEventListener('dragover', e => { e.preventDefault(); cpDrop.style.borderColor = 'var(--teal)'; });
        cpDrop.addEventListener('dragleave', e => { cpDrop.style.borderColor = ''; });
        cpDrop.addEventListener('drop', e => {
            e.preventDefault();
            cpDrop.style.borderColor = '';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handlePaletteRefImage(e.dataTransfer.files[0]);
            }
        });
        
        // Suporte para colar print (Ctrl+V) direto no painel
        document.addEventListener('paste', (e) => {
            const cpModal = document.getElementById('custom-palette-overlay');
            if (cpModal && cpModal.style.display !== 'none') {
                const items = (e.clipboardData || window.clipboardData).items;
                for (let item of items) {
                    if (item.type.indexOf('image') === 0) {
                        const file = item.getAsFile();
                        
                        // Força a mudança para a aba de referência visual
                        document.querySelectorAll('.cp-tab').forEach(t => t.classList.remove('active'));
                        const refTab = document.querySelector('.cp-tab[data-tab="reference"]');
                        if (refTab) refTab.classList.add('active');
                        
                        document.querySelectorAll('.cp-tab-content').forEach(c => c.classList.remove('active'));
                        const refContent = document.getElementById('cp-tab-reference');
                        if (refContent) refContent.classList.add('active');

                        handlePaletteRefImage(file);
                        e.preventDefault();
                        break;
                    }
                }
            }
        });
    }

    if (canvas) {
        canvas.addEventListener('click', e => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(x, y, 1, 1).data;
            const r = imageData[0], g = imageData[1], b = imageData[2];
            const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            
            // Add to manual list (sequential)
            const inputs = document.querySelectorAll('#cp-tab-manual .cp-color-input');
            const emptyInput = Array.from(inputs).find(inp => inp.value === '#000000' || inp.dataset.new === 'true');
            
            if (emptyInput) {
                emptyInput.value = hex;
                emptyInput.dataset.new = 'false';
            } else {
                // Shift colors if all full
                for(let i = 0; i < inputs.length - 1; i++) inputs[i].value = inputs[i+1].value;
                inputs[inputs.length - 1].value = hex;
            }
            toast(`Cor ${hex} capturada!`, 'success');
        });
    }
});

function handlePaletteRefImage(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.getElementById('cp-ref-canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            document.getElementById('cp-ref-preview-container').style.display = 'block';
            document.getElementById('cp-ref-drop').style.display = 'none';
            
            // Auto-Extração (Palette Thief V3 - Two-Pass, Brand-Friendly)
            const tmpC = document.createElement('canvas');
            const tmpCtx = tmpC.getContext('2d');
            tmpC.width = 100; tmpC.height = 100;
            tmpCtx.drawImage(img, 0, 0, 100, 100);
            const data = tmpCtx.getImageData(0, 0, 100, 100).data;

            function extractWithThreshold(minChroma) {
                const buckets = {};
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
                    if (a < 200) continue;
                    const max = Math.max(r,g,b), min = Math.min(r,g,b);
                    const chroma = max - min;
                    if (chroma < minChroma) continue;
                    if (max < 50) continue;
                    if (min > 210) continue;
                    const qR = Math.round(r / 32) * 32;
                    const qG = Math.round(g / 32) * 32;
                    const qB = Math.round(b / 32) * 32;
                    const key = `${qR},${qG},${qB}`;
                    const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                    if (!buckets[key]) buckets[key] = { score: 0, exact: hex };
                    buckets[key].score += chroma;
                }
                return Object.values(buckets).sort((a,b) => b.score - a.score).slice(0, 6);
            }

            // First pass: vibrant colors (chroma >= 20); second pass fallback for desaturated brands
            let sorted = extractWithThreshold(20);
            if (sorted.length === 0) sorted = extractWithThreshold(5);

            if (sorted.length > 0) {
                const inputs = document.querySelectorAll('#cp-tab-manual .cp-color-input');
                let inputIdx = 0;
                for (let i = 0; i < sorted.length && inputIdx < inputs.length; i++) {
                    inputs[inputIdx].value = sorted[i].exact;
                    inputs[inputIdx].dataset.new = 'false';
                    inputIdx++;
                }
                // Switch to Manual tab so user sees the extracted colors
                document.querySelectorAll('.cp-tab').forEach(t => t.classList.remove('active'));
                document.querySelector('.cp-tab[data-tab="manual"]')?.classList.add('active');
                document.querySelectorAll('.cp-tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById('cp-tab-manual')?.classList.add('active');
                toast(`✨ ${inputIdx} cores extraídas! Ajuste no painel manual.`, "success");
            } else {
                toast("Nenhuma cor detectada. Clique na imagem para capturar manualmente.", "info");
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

window.saveCustomPalette = function() {
  const bg = document.getElementById('cp-bg').value;
  const text = document.getElementById('cp-text').value;
  const bgType = document.getElementById('cp-bg-type').value;
  const colors = Array.from(document.querySelectorAll('#cp-tab-manual .cp-color-input')).map(inp => inp.value);

  state.customPalette = { bg, text, bgType, colors };
  state.selectedPalette = 'custom';
  
  const input = document.getElementById('chart-theme');
  if (input) input.value = 'custom';

  document.getElementById('custom-palette-overlay').style.display = 'none';
  renderPalettes();
  toast("Paleta customizada aplicada!", "success");
  log("André: Nova paleta customizada salva e ativa.");
};

// ─── DRAG TO SCROLL LOGIC ──────────────────────────────────────────
function initPaletteScroll() {
  const slider = document.getElementById('palette-selector-wrap');
  if (!slider) return;
  
  let isDown = false;
  let startX;
  let scrollLeft;

  slider.addEventListener('mousedown', (e) => {
    isDown = true;
    slider.style.cursor = 'grabbing';
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
  });

  window.addEventListener('mouseup', () => {
    isDown = false;
    if (slider) slider.style.cursor = 'grab';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDown || !slider) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 2.5; 
    slider.scrollLeft = scrollLeft - walk;
  });
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
    
    const res = await fetch('/preview-data', { method: 'POST', body: fd });
    
    if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ [Fetch] Erro:', res.status, errorText);
        throw new Error(`Servidor retornou ${res.status}: ${errorText || 'Falha ao analisar arquivo'}`);
    }
    
    const data = await res.json();
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
  if (state.uploadMode !== 'vision') {
    toast("Mude para o modo de Análise de Gráfico para colar imagens.", "error");
    return;
  }
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
    // IGNORA SE O MODAL DO TEMA ESTIVER ABERTO (delega pro listener do tema)
    const cpModal = document.getElementById('custom-palette-overlay');
    if (cpModal && cpModal.style.display !== 'none') {
        return; // Não envia para o pipeline principal
    }

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

  const closeModal = () => { if (modal) modal.style.display = 'none'; state.isRendering = false; state.zoomPoints = []; renderFileQueue(); };
  if (btnCloseJson) btnCloseJson.addEventListener('click', closeModal);
  if (btnCancelJson) btnCancelJson.addEventListener('click', closeModal);

  // ─── VISUAL EDITOR PREMIUM — Split Panel + Live Preview ──────────
  window.renderVisualEditor = function(analysis, stillUrl) {
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
      dataPoints = props.data.map(d => {
        if (d.values) return { label: d.label, value: d.values[0] || 0, values: d.values };
        return { label: d.label, value: Number(d.value) };
      });
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
            <div class="ve-field" style="display:flex; gap:8px;">
              <div style="flex:1;">
                <label class="ve-label">Unidade (unit)</label>
                <input type="text" id="edit-unit" class="ve-input" value="${(props.unit||'').replace(/"/g,'&quot;')}" placeholder="%, $, M...">
              </div>
              <div style="flex:1;">
                <label class="ve-label">Eixo Y — Mín</label>
                <input type="number" step="any" id="edit-ymin" class="ve-input" value="${props.yMin !== undefined ? props.yMin : ''}" placeholder="auto">
              </div>
              <div style="flex:1;">
                <label class="ve-label">Eixo Y — Máx</label>
                <input type="number" step="any" id="edit-ymax" class="ve-input" value="${props.yMax !== undefined ? props.yMax : ''}" placeholder="auto">
              </div>
            </div>

            <!-- TYPE SWITCHER (Restaurado) -->
            <div class="ve-field">
              <label class="ve-label">Tipo de Gráfico</label>
              <div class="ve-type-switcher" id="ve-type-switcher">
                <button class="ve-type-btn ${detectedType === 'BarChart' ? 'active' : ''}" data-type="BarChart" title="Bar Chart (Vertical)">📊</button>
                <button class="ve-type-btn ${detectedType === 'HorizontalBarChart' ? 'active' : ''}" data-type="HorizontalBarChart" title="Horizontal Bar">➖</button>
                <button class="ve-type-btn ${detectedType === 'LineChart' ? 'active' : ''}" data-type="LineChart" title="Line Chart">📈</button>
                <button class="ve-type-btn ${detectedType === 'RacingLineChart' ? 'active' : ''}" data-type="RacingLineChart" title="Line Race Chart">🏁</button>
                <button class="ve-type-btn ${detectedType === 'PieChart' ? 'active' : ''}" data-type="PieChart" title="Pie Chart">⭕</button>
                <button class="ve-type-btn ${detectedType === 'ComparativeBarChart' ? 'active' : ''}" data-type="ComparativeBarChart" title="Comparative Bar">⚖️</button>
                <button class="ve-type-btn ${detectedType === 'WaterfallChart' ? 'active' : ''}" data-type="WaterfallChart" title="Waterfall Chart">🌊</button>
              </div>
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
          <!-- Zoom picker — aparece só quando toggle-zoom está marcado -->
          <div id="ve-zoom-section" style="display:none;margin-top:12px;padding:10px;border:1px solid rgba(139,92,246,0.3);border-radius:8px;background:rgba(139,92,246,0.06);">
            <div style="font-size:12px;font-weight:600;color:#8b5cf6;margin-bottom:6px;">Pontos de Zoom Cinematográfico</div>
            <!-- Preview real do gráfico para clique -->
            <div id="ve-zoom-image-wrap" style="display:none;position:relative;margin-bottom:8px;border-radius:6px;overflow:hidden;cursor:crosshair;">
              <img id="ve-zoom-img" src="" style="width:100%;display:block;border-radius:6px;" />
              <div id="ve-zoom-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"></div>
            </div>
            <!-- Fallback quando auditor está desativado -->
            <div id="ve-zoom-no-still" style="display:none;font-size:11px;color:#888;margin-bottom:8px;padding:8px;border:1px dashed #444;border-radius:4px;">
              Ative <strong>Auditoria de Fidelidade</strong> para ver o preview fiel do gráfico e marcar pontos com precisão.
            </div>
            <div id="ve-zoom-list" style="display:flex;flex-direction:column;gap:4px;margin-bottom:8px;max-height:120px;overflow-y:auto;"></div>
            <button id="ve-zoom-clear" style="font-size:11px;padding:3px 10px;background:transparent;border:1px solid #555;border-radius:4px;color:#888;cursor:pointer;">Limpar tudo</button>
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
      
      const COLORS = ['#7c3aed','#06b6d4','#a855f7','#22c55e','#f59e0b','#ef4444','#3b82f6','#f97316'];

      tbody.innerHTML = editorData.map((dp, i) => {
        const rowColor = dp.color || COLORS[i % COLORS.length];
        return `
          <tr class="ve-row" data-idx="${i}">
            <td>
              <div style="display:flex; align-items:center; gap:8px;">
                <input type="color" class="ve-cell-color" data-idx="${i}" value="${rowColor}" title="Cor do elemento">
                <input type="text" class="ve-cell ve-cell-label" data-idx="${i}" value="${dp.label.replace(/"/g,'&quot;')}" placeholder="Label...">
              </div>
            </td>
            <td><input type="number" step="any" class="ve-cell ve-cell-value" data-idx="${i}" value="${dp.value}"></td>
            <td><button class="ve-del-row" data-idx="${i}" title="Remover">×</button></td>
          </tr>
        `;
      }).join('');

      // Eventos das células
      tbody.querySelectorAll('.ve-cell-color').forEach(inp => {
        inp.addEventListener('input', e => {
          editorData[e.target.dataset.idx].color = e.target.value;
          updatePreview();
        });
      });
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
      const DEFAULT_COLORS = ['#7c3aed','#06b6d4','#a855f7','#22c55e','#f59e0b','#ef4444','#3b82f6','#f97316'];

      let paths = '';
      const n = editorData.length;

      const getElementColor = (i) => editorData[i].color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];

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
          const color = getElementColor(i);
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

      } else if (editorType === 'LineChart' || editorType === 'RacingLineChart' || editorType === 'MultiLineChart') {
        // ── Line / Racing Preview ──
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
          const color = getElementColor(i);
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
          const color = getElementColor(i);
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

    // ── Zoom Cinematográfico ──────────────────────────────────────────
    const zoomSection   = document.getElementById('ve-zoom-section');
    const zoomImageWrap = document.getElementById('ve-zoom-image-wrap');
    const zoomImg       = document.getElementById('ve-zoom-img');
    const zoomOverlay   = document.getElementById('ve-zoom-overlay');
    const zoomNoStill   = document.getElementById('ve-zoom-no-still');
    const zoomList      = document.getElementById('ve-zoom-list');
    const zoomClearBtn  = document.getElementById('ve-zoom-clear');
    const zoomToggle    = document.getElementById('toggle-zoom');

    function renderZoomUI() {
      const pts = state.zoomPoints;

      // Marcadores numerados sobre a imagem
      if (zoomOverlay) {
        zoomOverlay.innerHTML = pts.map((p, i) => `
          <div style="position:absolute;left:calc(${p.x * 100}% - 10px);top:calc(${p.y * 100}% - 10px);
            width:20px;height:20px;border-radius:50%;background:#8b5cf6;border:2px solid #fff;
            display:flex;align-items:center;justify-content:center;
            font-size:10px;font-weight:700;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.7);">
            ${i + 1}
          </div>`).join('');
      }

      if (zoomList) {
        if (pts.length === 0) {
          zoomList.innerHTML = '<div style="font-size:11px;color:#666;">Nenhum ponto marcado ainda.</div>';
        } else {
          zoomList.innerHTML = pts.map((p, i) => `
            <div style="display:flex;align-items:center;gap:8px;font-size:11px;color:#ccc;">
              <span style="width:18px;height:18px;border-radius:50%;background:#8b5cf6;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0;">${i+1}</span>
              <span>x: ${(p.x * 100).toFixed(1)}%&nbsp;&nbsp;y: ${(p.y * 100).toFixed(1)}%</span>
              <button data-idx="${i}" style="margin-left:auto;background:transparent;border:none;color:#666;cursor:pointer;font-size:13px;line-height:1;" title="Remover">×</button>
            </div>`).join('');
          zoomList.querySelectorAll('button[data-idx]').forEach(btn => {
            btn.addEventListener('click', e => {
              state.zoomPoints.splice(parseInt(e.currentTarget.dataset.idx), 1);
              renderZoomUI();
            });
          });
        }
      }
    }

    function applyZoomMode(active) {
      if (!zoomSection) return;
      zoomSection.style.display = active ? 'block' : 'none';

      if (!active) {
        state.zoomPoints = [];
        if (zoomOverlay) zoomOverlay.innerHTML = '';
        renderZoomUI();
        return;
      }

      // Usa o still real (fiel ao gráfico) quando disponível
      if (stillUrl && zoomImageWrap && zoomImg) {
        zoomImg.src = stillUrl;
        zoomImageWrap.style.display = 'block';
        if (zoomNoStill) zoomNoStill.style.display = 'none';
      } else {
        if (zoomImageWrap) zoomImageWrap.style.display = 'none';
        if (zoomNoStill) zoomNoStill.style.display = 'block';
      }

      renderZoomUI();
    }

    // Clique na imagem real para registrar pontos
    if (zoomImg) {
      zoomImg.addEventListener('click', e => {
        if (!zoomToggle?.checked) return;
        const rect = zoomImg.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        state.zoomPoints.push({ x: Math.max(0, Math.min(1, nx)), y: Math.max(0, Math.min(1, ny)) });
        renderZoomUI();
      });
    }

    if (zoomClearBtn) {
      zoomClearBtn.addEventListener('click', () => {
        state.zoomPoints = [];
        renderZoomUI();
      });
    }

    if (zoomToggle) {
      zoomToggle.addEventListener('change', () => applyZoomMode(zoomToggle.checked));
    }

    // Init — apply current checkbox state
    applyZoomMode(!!zoomToggle?.checked);

    // Expõe dados para o botão Confirmar (retrocompatibilidade total)
    container._getEditorData = () => editorData;
    container._getEditorType = () => editorType;
  }

  if (btnConfirmJson) {
      btnConfirmJson.addEventListener('click', async () => {
          try {
              const container = document.getElementById('visual-editor-container');
              const title    = document.getElementById('edit-title')?.value || '';
              const subtitle = document.getElementById('edit-subtitle')?.value || '';
              const engine   = document.getElementById('edit-engine')?.value || 'remotion';

              // ── Novo Editor Premium ───────────────────────────────────────
              let newLabels = [], newData = [], editorData = [];
              if (container && typeof container._getEditorData === 'function') {
                  editorData = container._getEditorData();
                  newLabels = editorData.map(d => d.label);
                  newData   = editorData.map(d => d.value);
              } else {
                  // Fallback para o editor antigo (caso alguma versão antiga ainda esteja no DOM)
                  document.querySelectorAll('.edit-label').forEach((input, i) => {
                      const label = input.value;
                      const value = parseFloat(document.querySelectorAll('.edit-value')[i]?.value) || 0;
                      newLabels.push(label);
                      newData.push(value);
                      editorData.push({ label, value });
                  });
              }

              // Reconstruir objeto de análise
              const editedAnalysis = JSON.parse(JSON.stringify(state.currentAnalysis));
              editedAnalysis.props.title    = title;
              editedAnalysis.props.subtitle = subtitle;
              editedAnalysis.props.labels   = newLabels;
              const yMinVal = document.getElementById('edit-ymin')?.value;
              const yMaxVal = document.getElementById('edit-ymax')?.value;
              const unitVal = document.getElementById('edit-unit')?.value;
              if (yMinVal !== '' && yMinVal !== undefined) editedAnalysis.props.yMin = Number(yMinVal);
              else delete editedAnalysis.props.yMin;
              if (yMaxVal !== '' && yMaxVal !== undefined) editedAnalysis.props.yMax = Number(yMaxVal);
              else delete editedAnalysis.props.yMax;
              if (unitVal !== undefined) editedAnalysis.props.unit = unitVal;

              // Propaga o tipo de gráfico se o usuário trocou no switcher
              const newType = (container && typeof container._getEditorType === 'function') 
                              ? container._getEditorType() 
                              : editedAnalysis.componentId;
              editedAnalysis.componentId = newType;

              const isMultiLine = newType === 'LineChart' || newType === 'RacingLineChart' || newType === 'MultiLineChart';

              if (!isMultiLine) {
                  // Atualizar séries de dados single-column
                  if (editedAnalysis.props.series) {
                      editedAnalysis.props.series[0].data = newData;
                      // NOVO: Preservar cores se editadas individualmente
                      editedAnalysis.props.seriesColors = editorData.map((d, i) => d.color || null).filter(Boolean);
                  } else {
                      editedAnalysis.props.series = [{ label: title || 'Série 1', data: newData }];
                  }
                  if (editedAnalysis.props.data) {
                      editedAnalysis.props.data = newLabels.map((l, i) => ({ 
                        label: l, 
                        value: newData[i],
                        color: editorData[i].color // NOVO: Mapeia cor para o objeto de dados
                      }));
                  }
                  if (editedAnalysis.props.datasets) {
                      editedAnalysis.props.datasets[0].data = newData;
                  }
                  editedAnalysis.props.labels = newLabels;
              } else {
                  // Para MultiLineChart, NÃO sobrescrevemos series/labels com dados da Grid 
                  // porque a Grid não suporta múltiplas colunas editáveis ainda.
                  // Apenas garantimos que a estrutura esteja correta caso tenha vindo de outro tipo.
                  if (!editedAnalysis.props.series || !editedAnalysis.props.labels) {
                      editedAnalysis.props.labels = newLabels;
                      editedAnalysis.props.series = [{ label: title || 'Série 1', data: newData }];
                  }
              }

              const selectedPaletteObj = state.selectedPalette === 'custom' 
                                          ? state.customPalette 
                                          : PALETTES.find(p => p.id === state.selectedPalette);
               const isDarkBg = selectedPaletteObj ? selectedPaletteObj.bgType === 'dark' : true;

               log("André: Iniciando renderização com dados revisados...");
               setProgress(55, "Gerando Vídeo...");

               const res = await fetch(`/jobs/${state.currentJobId}/start-render`, {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({
                       analysis: editedAnalysis,
                       originalName: state.originalFilename,
                       chartTheme: state.selectedPalette,
                       customPalette: state.selectedPalette === 'custom' ? state.customPalette : null,
                       isDarkBg: isDarkBg,
                       options: {
                         engine: engine,
                         backgroundType: isDarkBg ? 'dark' : 'light',
                         exportAlpha: String(document.getElementById('toggle-alpha')?.checked || false)
                       },
                       includeCallouts: document.getElementById('toggle-callouts')?.checked || false,
                       zoomPoints: (document.getElementById('toggle-zoom')?.checked && state.zoomPoints.length > 0)
                         ? state.zoomPoints
                         : []
                   })
               });

              if (!res.ok) throw new Error("Falha ao iniciar renderização");
              
              modal.style.display = 'none';
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
          if (state.selectedPalette === 'custom') {
            fd.append('customPalette', JSON.stringify(state.customPalette));
          }
          
          fd.append('includeCallouts', document.getElementById('toggle-callouts').checked);
          fd.append('enableAuditor', document.getElementById('toggle-auditor').checked);
          fd.append('exportAlpha', document.getElementById('toggle-alpha').checked);
          fd.append('reviewRequired', true);

          log(`Pedro: Enviando ${f.name}...`);
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
            } else if (errorMsg.includes('Título ausente')) {
                toast("❌ Título não detectado. Se for uma logomarca, use o botão 'EDITAR CORES'!", "error");
                if (banner) {
                    banner.classList.remove('hidden');
                    bannerDesc.innerHTML = `<strong>Erro de Análise:</strong> Título não encontrado.<br><br>Parece que você subiu uma imagem de marca no lugar de um gráfico. Se quiser extrair cores, abra o modal <strong>EDITAR CORES</strong> na seção de estilos.`;
                }
            } else {
                toast(`Erro: ${errorMsg}`, "error");
            }

            f.status = 'pending'; // Reverte para pending para reativar o botão
            state.isRendering = false;
            renderFileQueue();
            return;
          }
          
          // Reset banner if progressing
          document.getElementById('critical-error-banner').classList.add('hidden');
          startPolling(data.jobId, f.name, f.id);
        }
      } catch (err) {
        log(`✕ Erro: ${err.message}`, 'error');
        toast(`Erro no processamento: ${err.message}`, 'error');
        pending.forEach(f => { if (f.status === 'processing') f.status = 'pending'; }); // Resgata arquivos travados
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
   // Render Palettes
   renderPalettes();
   initPaletteScroll();

   // Eventos do Modal de Paleta
   document.getElementById('btn-close-palette')?.addEventListener('click', () => {
     document.getElementById('custom-palette-overlay').style.display = 'none';
   });
   document.getElementById('btn-cancel-palette')?.addEventListener('click', () => {
     document.getElementById('custom-palette-overlay').style.display = 'none';
   });
   document.getElementById('btn-save-palette')?.addEventListener('click', saveCustomPalette);

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
   POLLING — Resiliência Total
═══════════════════════════════════════════════════════════════ */
function stopPolling() {
  if (state.pollInterval) {
    clearInterval(state.pollInterval);
    state.pollInterval = null;
  }
}

function startPolling(jobId, fileName, fileId) {
  if (state.pollInterval) clearInterval(state.pollInterval);
  state.currentJobId = jobId;
  state.lastLogLength = 0;

  const interval = setInterval(async () => {
    try {
      const res = await fetch(`/progress/${jobId}`);
      if (!res.ok) return;

      const msg = await res.json();

      if (msg.progress !== undefined) {
        setProgress(msg.progress, msg.stage || '');
        if (msg.log && msg.log.length > state.lastLogLength) {
          const newContent = msg.log.slice(state.lastLogLength);
          state.lastLogLength = msg.log.length;
          newContent.split('\n').filter(Boolean).forEach(line => log(line, msg.logType || 'info'));
        }
      }

      if (msg.status === 'awaiting_review') {
          clearInterval(interval);
          state.currentJobId = jobId;
          state.currentAnalysis = msg.analysis;
          state.stillUrl = msg.stillUrl || null;
          state.zoomPoints = []; // limpa pontos de qualquer job anterior

          // Open Modal & Render Visual Editor
          const modal = document.getElementById('json-editor-overlay');
          if (modal) {
              if (window.renderVisualEditor) window.renderVisualEditor(msg.analysis, state.stillUrl);
              modal.style.display = 'flex';
          }
          log("João: Análise concluída. Aguardando revisão dos dados...", "accent");
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
        log(`André: Vídeo 4K UHD concluído.`, 'success');
        toast('Renderização 4K concluída!', 'success');
        
        loadVideo(msg.videoUrl, fileName, msg.duration || '', jobId);
        
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
        renderFileQueue(); 
      }
    } catch(err) {
      console.error('Polling Error:', err);
    }
  }, 2000);

  state.pollInterval = interval;
}

/* ═══════════════════════════════════════════════════════════════
   VIDEO PLAYER
═══════════════════════════════════════════════════════════════ */
function loadVideo(url, name, duration, jobId = null) {
  const video       = document.getElementById('preview-video');
  const placeholder = document.getElementById('player-placeholder');
  const meta        = document.getElementById('video-meta');
  const alphaWarning = document.getElementById('alpha-warning');

  if (!video) return;

  const isAlpha = url.toLowerCase().endsWith('.mov');

  if (isAlpha) {
    video.style.display = 'none';
    if (placeholder) {
      placeholder.style.display = 'flex';
      placeholder.innerHTML = `
        <div class="alpha-notice">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <h3>Vídeo Alpha Gerado</h3>
          <p>Arquivos ProRes 4444 (.mov) não são suportados para visualização direta no navegador.</p>
          <p><strong>Faça o download para usar com transparência no Premiere ou After Effects.</strong></p>
        </div>
      `;
    }
  } else {
    video.src = url;
    video.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
  }

  state.currentVideo = { url, name };
  if (duration && meta) meta.textContent = `⏱ ${duration}  ·  UHD 4K Video`;
  
  const btnDownload = document.getElementById('btn-download-video');
  if (btnDownload) {
    btnDownload.style.display = 'inline-flex';
    btnDownload.onclick = () => { triggerDownload(url, name, jobId || state.currentJobId); };
  }
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
  const extMatch = url.match(/\.([a-z0-9]+)(\?|$)/i);
  const extension = extMatch ? extMatch[1] : 'mp4';
  
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${cleanName}_GiantAnimator_4K.${extension}`;
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

function chartTypeIcon(filename) {
  const n = (filename || '').toLowerCase();
  if (n.includes('bar') && n.includes('horizontal')) return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="18" y2="6"/><line x1="3" y1="12" x2="13" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
  if (n.includes('bar') || n.includes('column')) return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="10" width="4" height="11"/><rect x="10" y="5" width="4" height="16"/><rect x="17" y="13" width="4" height="8"/></svg>`;
  if (n.includes('line') || n.includes('multiline')) return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,17 8,11 13,14 21,6"/></svg>`;
  if (n.includes('pie') || n.includes('donut')) return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.5 4"/></svg>`;
  if (n.includes('area')) return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,17 8,10 13,13 21,5"/><line x1="3" y1="17" x2="21" y2="17"/></svg>`;
  if (n.includes('scatter')) return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="15" r="2"/><circle cx="13" cy="8" r="2"/><circle cx="19" cy="13" r="2"/><circle cx="9" cy="19" r="2"/></svg>`;
  if (n.includes('waterfall')) return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="12" width="4" height="9"/><rect x="9" y="7" width="4" height="5"/><rect x="15" y="9" width="4" height="12"/></svg>`;
  if (n.includes('racing')) return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="7" x2="16" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="11" y2="17"/></svg>`;
  // default
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="8" width="4" height="13"/><rect x="10" y="4" width="4" height="17"/><rect x="17" y="11" width="4" height="10"/></svg>`;
}

function chartTypeLabel(filename) {
  const n = (filename || '').toLowerCase();
  if (n.includes('horizontal')) return 'Barras H';
  if (n.includes('bar') || n.includes('column')) return 'Barras';
  if (n.includes('multiline')) return 'Multi-linha';
  if (n.includes('line')) return 'Linha';
  if (n.includes('donut')) return 'Donut';
  if (n.includes('pie')) return 'Pizza';
  if (n.includes('area')) return 'Área';
  if (n.includes('scatter')) return 'Dispersão';
  if (n.includes('waterfall')) return 'Cascata';
  if (n.includes('racing')) return 'Racing';
  return 'Gráfico';
}

function chartAccentColor(filename) {
  const n = (filename || '').toLowerCase();
  if (n.includes('line')) return ['#1e3a5f', '#3b82f6'];
  if (n.includes('pie') || n.includes('donut')) return ['#3b1f5e', '#a855f7'];
  if (n.includes('area')) return ['#1a3d2e', '#22c55e'];
  if (n.includes('scatter')) return ['#3d2a1a', '#f59e0b'];
  if (n.includes('waterfall')) return ['#1f3040', '#06b6d4'];
  if (n.includes('racing')) return ['#3d1f2a', '#ef4444'];
  return ['#1e1b3a', '#5e4fff']; // bar / default
}

function renderHistory() {
  const el = document.getElementById('history-list');
  const countEl = document.getElementById('history-count');
  const clearBtn = document.getElementById('btn-clear-history');
  if (!el) return;

  const GRID_LIMIT = 16;
  const visible = state.history.slice(0, GRID_LIMIT);

  if (countEl) countEl.textContent = `${visible.length} / ${GRID_LIMIT}`;
  if (clearBtn) clearBtn.style.display = state.history.length > 0 ? 'flex' : 'none';

  if (!state.history.length) {
    el.innerHTML = '<div class="history-empty">Nenhuma animação gerada ainda</div>';
    return;
  }

  const playIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;

  el.innerHTML = `<div class="history-grid">${visible.map(h => {
    const url = h.videoUrl || '/output/' + h.outputFile;
    const name = (h.filename || h.name || '').replace(/'/g, '&#39;');
    const safeName = (h.filename || h.name || '');
    const date = new Date(h.createdAt).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
    const thumbUrl = h.thumbnailFile ? `/output/${h.thumbnailFile}` : null;
    const [bg1, bg2] = chartAccentColor(safeName);

    const inner = thumbUrl
      ? `<img src="${thumbUrl}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
         <div class="hist-icon-fallback" style="display:none;">
           <div class="hist-icon-wrap">${chartTypeIcon(safeName)}</div>
           <span class="hist-type-label">${chartTypeLabel(safeName)}</span>
         </div>`
      : `<div class="hist-icon-wrap">${chartTypeIcon(safeName)}</div>
         <span class="hist-type-label">${chartTypeLabel(safeName)}</span>`;

    return `
      <div class="hist-card" style="background:linear-gradient(145deg,${bg1},${bg2 + '44'});"
           onclick="loadVideo('${url}', '${name}', '${h.duration || ''}')">
        ${inner}
        <div class="hist-card-hover">
          <div class="hist-play-btn">${playIcon}</div>
        </div>
        <div class="hist-card-footer">
          <span class="hist-card-footer-name">${safeName}</span>
          <span class="hist-card-footer-date">${date}</span>
        </div>
      </div>`;
  }).join('')}</div>`;
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
