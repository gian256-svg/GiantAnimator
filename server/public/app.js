// server/public/app.js — v3 (Split-Screen & Property Panel)

// ─── Estado global ──────────────────────────────────────────
let currentJob = null;
let currentProps = {};
let originalProps = {};
let debounceTimer = null;
const activeUploads = new Map();

// ─── Inicialização ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    connectSSE();
    refreshHistory();
    initAccordion();
});

// ─── SSE (Eventos em tempo real) ─────────────────────────────
function connectSSE() {
    const dot = document.getElementById('connection-dot');
    const statusText = document.getElementById('status-text');
    
    const evtSource = new EventSource('/events');
    
    evtSource.onopen = () => {
        dot.className = 'dot';
        statusText.textContent = 'Pronto';
    };

    evtSource.onmessage = (e) => {
        const data = JSON.parse(e.data);
        console.log('📡 [SSE]', data);

        if (data.type === 'processing') {
            showToast(`⏳ Analisando: ${data.filename}`);
            document.getElementById('processing-section').style.display = 'flex';
            document.getElementById('processing-filename').textContent = `Analisando ${data.filename}...`;
            dot.className = 'dot loading';
        } 
        else if (data.type === 'render_complete' || data.type === 'done') {
            showToast(`✅ Pronto: ${data.filename}`, 'success');
            document.getElementById('processing-section').style.display = 'none';
            dot.className = 'dot';
            
            // Preview do vídeo
            if (data.videoUrl || data.outputFile) {
                const videoUrl = data.videoUrl || `/download/${data.outputFile}`;
                showPreview(videoUrl, data.props, data.id || data.jobId);
            }
            refreshHistory();
        } 
        else if (data.type === 'error') {
            showToast(`❌ Erro: ${data.message}`, 'error');
            document.getElementById('processing-section').style.display = 'none';
            dot.className = 'dot error';
        }
    };

    evtSource.onerror = () => {
        dot.className = 'dot error';
        statusText.textContent = 'Desconectado';
        evtSource.close();
        setTimeout(connectSSE, 5000);
    };
}

// ─── Preview & Painel ────────────────────────────────────────
function showPreview(url, props, id) {
    const video = document.getElementById('preview-video');
    const previewSection = document.getElementById('preview-section');
    
    currentJob = { id, videoUrl: url, props };
    video.src = `${url}?t=${Date.now()}`;
    previewSection.style.display = 'flex';

    if (props) {
        initPanel(props);
    }
}

// ─── Painel de Propriedades (Snippet do Usuário) ─────────────
function initAccordion() {
    document.querySelectorAll('.prop-block-title').forEach(title => {
        title.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-reset-block')) return;
            const targetId = title.dataset.target;
            const body     = document.getElementById(targetId);
            const chevron  = title.querySelector('.chevron');
            const collapsed = body.classList.toggle('collapsed');
            chevron.textContent = collapsed ? '▼' : '▲';
        });
    });
}

function bindColorPair(pickerId, hexId, propKey) {
    const picker = document.getElementById(pickerId);
    const hex    = document.getElementById(hexId);
    if (!picker || !hex) return;

    picker.addEventListener('input', () => {
        hex.value = picker.value;
        setProp(propKey, picker.value);
    });

    hex.addEventListener('input', () => {
        if (/^#[0-9a-fA-F]{6}$/.test(hex.value)) {
            picker.value = hex.value;
            setProp(propKey, hex.value);
        }
    });
}

bindColorPair('prop-bg-color',    'prop-bg-color-hex',    'backgroundColor');
bindColorPair('prop-text-color',  'prop-text-color-hex',  'textColor');
bindColorPair('prop-muted-color', 'prop-muted-color-hex', 'mutedColor');

const scaleInput = document.getElementById('prop-scale');
const scaleLabel = document.getElementById('scale-value-label');

scaleInput?.addEventListener('input', () => {
    const val = parseFloat(scaleInput.value);
    scaleLabel.textContent = val.toFixed(2) + '×';
    setProp('scale', val);
});

document.getElementById('prop-title')?.addEventListener('input', (e) => {
    setProp('title', e.target.value);
});

function setProp(key, value) {
    currentProps[key] = value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyProps, 500);
}

async function applyProps() {
    if (!currentJob || !currentProps) return;
    try {
        const res = await fetch('/rerender', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                jobId: currentJob.id, 
                props: { ...currentJob.props, ...currentProps } 
            })
        });
        if (res.ok) {
            const result = await res.json();
            const video = document.getElementById('preview-video');
            video.src = `/download/${result.outputFile}?t=${Date.now()}`;
            showToast('🔄 Atualizado', 'success');
        }
    } catch (err) {
        console.warn('Erro ao aplicar props:', err);
    }
}

function buildDataFields(data = []) {
    const container = document.getElementById('dynamic-data-fields');
    if (!container) return;
    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'data-grid';

    data.forEach((item, i) => {
        const labelRow = document.createElement('div');
        labelRow.className = 'prop-row';
        labelRow.innerHTML = `<label>Label ${i + 1}</label><input type="text" value="${item.label ?? ''}" data-index="${i}" data-field="label">`;
        const valRow = document.createElement('div');
        valRow.className = 'prop-row';
        valRow.innerHTML = `<label>Val ${i + 1}</label><input type="number" value="${item.value ?? ''}" data-index="${i}" data-field="value">`;
        grid.appendChild(labelRow); grid.appendChild(valRow);
    });
    container.appendChild(grid);
    container.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            const idx   = parseInt(input.dataset.index);
            const field = input.dataset.field;
            if (!currentProps.data) currentProps.data = JSON.parse(JSON.stringify(currentJob.props.data));
            currentProps.data[idx][field] = field === 'value' ? parseFloat(input.value) : input.value;
            setProp('data', currentProps.data);
        });
    });
}

function buildColorFields(data = [], colors = []) {
    const container = document.getElementById('dynamic-color-fields');
    if (!container) return;
    container.innerHTML = '';
    if (data.length === 0) return;

    const sep = document.createElement('div');
    sep.className = 'prop-separator'; sep.textContent = 'Cores dos elementos';
    container.appendChild(sep);

    data.forEach((item, i) => {
        const defaultColor = colors[i] ?? '#7c6af7';
        const row = document.createElement('div');
        row.className = 'prop-row';
        row.innerHTML = `
            <label>${item.label ?? 'Item ' + (i + 1)}</label>
            <div class="color-input-group">
                <input type="color"  id="el-color-${i}" value="${defaultColor}">
                <input type="text"   id="el-color-hex-${i}" value="${defaultColor}" maxlength="7">
            </div>
        `;
        container.appendChild(row);
        const picker = row.querySelector(`#el-color-${i}`);
        const hex    = row.querySelector(`#el-color-hex-${i}`);
        picker.addEventListener('input', () => { hex.value = picker.value; setElementColor(i, picker.value); });
        hex.addEventListener('input', () => { if (/^#[0-9a-fA-F]{6}$/.test(hex.value)) { picker.value = hex.value; setElementColor(i, hex.value); } });
    });
}

function setElementColor(index, value) {
    if (!currentProps.elementColors) currentProps.elementColors = [...(currentJob.props.elementColors || [])];
    currentProps.elementColors[index] = value;
    setProp('elementColors', currentProps.elementColors);
}

function initPanel(props) {
    currentProps  = {};
    originalProps = JSON.parse(JSON.stringify(props));
    document.getElementById('right-panel').style.display = 'flex';
    refreshPanelFromProps(props);
    buildDataFields(props.data ?? []);
    buildColorFields(props.data ?? [], props.elementColors ?? props.colors ?? []);
}

function refreshPanelFromProps(p) {
    if (p.title !== undefined) document.getElementById('prop-title').value = p.title ?? '';
    if (p.backgroundColor) {
        document.getElementById('prop-bg-color').value = p.backgroundColor;
        document.getElementById('prop-bg-color-hex').value = p.backgroundColor;
    }
    if (p.textColor) {
        document.getElementById('prop-text-color').value = p.textColor;
        document.getElementById('prop-text-color-hex').value = p.textColor;
    }
    if (p.scale !== undefined) {
        scaleInput.value = p.scale;
        scaleLabel.textContent = parseFloat(p.scale).toFixed(2) + '×';
    }
}

// ─── Upload Tabs ─────────────────────────────────────────────
document.querySelectorAll('.upload-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const isTable = tab.dataset.tab === 'table';
        document.getElementById('drop-zone-image').style.display = isTable ? 'none' : 'flex';
        document.getElementById('drop-zone-table').style.display = isTable ? 'flex' : 'none';
    });
});

// ─── Drop Zone: Imagem ───────────────────────────────────────
const dzImage = document.getElementById('drop-zone-image');
dzImage?.addEventListener('click', () =>
    document.getElementById('file-input-image').click()
);
dzImage?.addEventListener('dragover', e => {
    e.preventDefault(); dzImage.classList.add('drag-over');
});
dzImage?.addEventListener('dragleave', () => dzImage.classList.remove('drag-over'));
dzImage?.addEventListener('drop', e => {
    e.preventDefault(); dzImage.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) uploadImage(file);
});
document.getElementById('file-input-image')?.addEventListener('change', e => {
    if (e.target.files[0]) uploadImage(e.target.files[0]);
});

// ─── Drop Zone: Tabela ───────────────────────────────────────
const dzTable = document.getElementById('drop-zone-table');
dzTable?.addEventListener('click', () =>
    document.getElementById('file-input-table').click()
);
dzTable?.addEventListener('dragover', e => {
    e.preventDefault(); dzTable.classList.add('drag-over');
});
dzTable?.addEventListener('dragleave', () => dzTable.classList.remove('drag-over'));
dzTable?.addEventListener('drop', e => {
    e.preventDefault(); dzTable.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) uploadTable(file);
});
document.getElementById('file-input-table')?.addEventListener('change', e => {
    if (e.target.files[0]) uploadTable(e.target.files[0]);
});

// ─── Paste global (imagem) ───────────────────────────────────
window.addEventListener('paste', e => {
    const item = e.clipboardData?.items[0];
    if (item?.type.includes('image')) uploadImage(item.getAsFile());
});

// ─── Upload de Imagem ────────────────────────────────────────
async function uploadImage(file) {
    showProcessing(file.name);
    const formData = new FormData();
    formData.append('image', file);
    try {
        const res = await fetch('/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
    } catch (err) {
        showToast(`❌ ${err.message}`, 'error');
        hideProcessing();
    }
}

// ─── Upload de Tabela ────────────────────────────────────────
async function uploadTable(file) {
    const validExts = ['.xlsx', '.xls', '.csv', '.ods'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!validExts.includes(ext)) {
        showToast(`❌ Formato inválido. Use: ${validExts.join(', ')}`, 'error');
        return;
    }

    showProcessing(file.name, '📊');
    const formData = new FormData();
    formData.append('table', file);

    try {
        const res = await fetch('/upload-table', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
    } catch (err) {
        showToast(`❌ ${err.message}`, 'error');
        hideProcessing();
    }
}

function showProcessing(filename, icon = '⚙️') {
    document.getElementById('processing-section').style.display = 'flex';
    document.getElementById('processing-filename').textContent = `${icon} Processando: ${filename}`;
}

function hideProcessing() {
    document.getElementById('processing-section').style.display = 'none';
}

// ─── Histórico ───────────────────────────────────────────────
async function refreshHistory() {
    try {
        const items = await fetch('/history').then(r => r.json());
        const list = document.getElementById('history-list');
        list.innerHTML = items.map(item => `
            <div class="history-item" onclick="loadFromHistory('${item.id}')">
                <div class="thumb">🎞️</div>
                <div class="info">
                    <div class="name">${item.filename}</div>
                    <div class="time">${new Date(item.createdAt).toLocaleTimeString()}</div>
                </div>
            </div>
        `).join('');
    } catch (err) { console.error(err); }
}

async function loadFromHistory(id) {
    try {
        const items = await fetch('/history').then(r => r.json());
        const item = items.find(i => i.id === id);
        if (item) {
            showPreview(`/download/${item.outputFile}`, item.props, item.id);
            showToast('📂 Carregado');
        }
    } catch (err) { console.error(err); }
}

// ─── Utilitários ─────────────────────────────────────────────
function showToast(msg, type = 'info') {
    let t = document.getElementById('toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toast';
        t.style.cssText = `
            position:fixed; bottom:20px; left:50%; transform:translateX(-50%);
            background:#1c1c26; border:1px solid #2a2a3a; color:#e8e8f0;
            padding:8px 18px; border-radius:20px; font-size:12px;
            z-index:9999; transition:opacity 0.3s;
        `;
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    t.style.borderLeft = type === 'error' ? '4px solid #f87171' : (type === 'success' ? '4px solid #34d399' : '1px solid #2a2a3a');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.style.opacity = '0', 3000);
}

document.getElementById('btn-download')?.addEventListener('click', () => {
    if (currentJob) window.open(currentJob.videoUrl, '_blank');
});

document.getElementById('btn-copy-json')?.addEventListener('click', () => {
    if (currentJob) {
        navigator.clipboard.writeText(JSON.stringify(currentJob.props, null, 2));
        showToast('📋 JSON Copiado', 'success');
    }
});

document.getElementById('btn-rerender')?.addEventListener('click', applyProps);

window.GiantAnimator = { initPanel, buildDataFields, buildColorFields, showToast };
