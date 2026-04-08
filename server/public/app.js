/* server/public/app.js — v2 corrigido */

let currentJob = null;
const activeUploads = new Map();

// --- Partículas ---
function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.opacity = Math.random() * 0.5;
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 1, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${this.opacity})`;
            ctx.fill();
        }
    }
    window.addEventListener('resize', resize);
    resize();
    for (let i = 0; i < 60; i++) particles.push(new Particle());
    (function animate() { ctx.clearRect(0,0,canvas.width,canvas.height); particles.forEach(p=>{p.update();p.draw();}); requestAnimationFrame(animate); })();
}

// --- Toasts ---
function showToast(message, type = 'info', duration = 5000) {
    const icons = { success: '✅', error: '❌', info: '🔔', warning: '⚠️' };
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.cssText += 'opacity:0;transform:translateX(100%);transition:all 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

// --- SSE ---
function connectSSE() {
    const evtSource = new EventSource('/events');
    evtSource.onmessage = (e) => {
        const data = JSON.parse(e.data);
        console.log('📡 [SSE]', data);
        const itemEl = findUploadItem(data.filename);
        if (data.type === 'processing') {
            showToast(`⏳ Analisando: ${data.filename}`, 'info');
            if (itemEl) setCardStatus(itemEl, 'processing', '🤖 Analisando...');
        } else if (data.type === 'done') {
            showToast(`🎬 Pronto: ${data.filename} em ${data.duration}s`, 'success', 8000);
            if (itemEl) {
                setCardStatus(itemEl, 'done', `✅ Concluído em ${data.duration}s`);
                setTimeout(() => {
                    itemEl.style.cssText += 'opacity:0;transition:opacity 0.8s';
                    setTimeout(() => { itemEl.remove(); activeUploads.delete(data.filename); }, 800);
                }, 4000);
            }
            refreshHistory();
        } else if (data.type === 'error') {
            showToast(`❌ Erro: ${data.message}`, 'error', 10000);
            if (itemEl) {
                setCardStatus(itemEl, 'error', `❌ ${data.message}`);
                setTimeout(() => {
                    itemEl.style.cssText += 'opacity:0;transition:opacity 0.8s';
                    setTimeout(() => { itemEl.remove(); activeUploads.delete(data.filename); }, 800);
                }, 6000);
            }
        }
    };
    evtSource.onerror = () => { evtSource.close(); setTimeout(connectSSE, 5000); };
}

function findUploadItem(filename) {
    if (!filename) return null;
    for (const [key, el] of activeUploads.entries()) {
        if (key === filename || filename.endsWith(key) || key.endsWith(filename)) return el;
    }
    return null;
}

function setCardStatus(el, state, text) {
    const status = el.querySelector('.status');
    const bar = el.querySelector('.upload-bar');
    if (status) status.textContent = text;
    if (bar) {
        const styles = {
            processing: 'width:100%;background:linear-gradient(90deg,#7c6aff,#00d4ff);animation:pulse 1.5s ease-in-out infinite',
            done:       'width:100%;background:#22c55e;animation:none',
            error:      'width:100%;background:#ef4444;animation:none'
        };
        bar.style.cssText = styles[state] || '';
    }
}

// --- Histórico ---
async function refreshHistory() {
    try {
        const items = await fetch('/history').then(r => r.json());
        const list = document.getElementById('history-list');
        if (!items.length) {
            list.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:20px">Nenhum vídeo gerado ainda.</p>';
            return;
        }
        list.innerHTML = items.map(item => `
            <div class="history-card" data-id="${item.id}"
                 data-job='${JSON.stringify(item).replace(/'/g, "&#39;")}'>
                <div class="card-info">
                    <span class="card-icon">🎞️</span>
                    <div class="card-details">
                        <strong>${item.filename}</strong>
                        <small>${item.duration ?? '?'}s • ${new Date(item.createdAt).toLocaleString('pt-BR')}</small>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-secondary"
                            onclick="openPlayer(this.closest('.history-card'))">▶️ Preview</button>
                    <a href="/download/${item.outputFile}" class="btn btn-primary" download>⬇️ Download</a>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('❌ refreshHistory:', err);
    }
}

// --- Player ---
function openPlayer(cardEl) {
    currentJob = JSON.parse(cardEl.dataset.job);
    const video = document.getElementById('player-video');
    video.src = `/download/${currentJob.outputFile}`;
    document.getElementById('player-title').textContent = currentJob.filename;
    const propsPanel = document.getElementById('props-panel');
    if (currentJob.props) { propsPanel.style.display = 'block'; renderPropsControls(currentJob.props); }
    else propsPanel.style.display = 'none';
    document.getElementById('player-modal').style.display = 'flex';
}

function closePlayer() {
    document.getElementById('player-modal').style.display = 'none';
    document.getElementById('player-video').src = '';
    currentJob = null;
}

let rerenderTimeout;
function debouncedRerender() {
    clearTimeout(rerenderTimeout);
    rerenderTimeout = setTimeout(() => {
        forceRerender();
    }, 300);
}

function updateProp(key, value, isNested = false, index = null, subkey = null) {
    if (!currentJob) return;
    if (isNested) {
        if (!currentJob.props[key]) currentJob.props[key] = [];
        if (subkey) {
            if (!currentJob.props[key][index]) currentJob.props[key][index] = {};
            currentJob.props[key][index][subkey] = value;
        } else {
            currentJob.props[key][index] = value;
        }
    } else {
        currentJob.props[key] = value;
    }
    debouncedRerender();
}

function toggleAccordion(btn) {
    const parent = btn.closest('.accordion');
    parent.classList.toggle('open');
}

function copyPropsJson() {
    if (!currentJob) return;
    navigator.clipboard.writeText(JSON.stringify(currentJob.props, null, 2));
    showToast('✅ Props copiados!', 'success');
}

// Valores padrão hardcoded para reset
const defaultProps = {
    labelFontSize: 14, titleFontSize: 32, valueFontSize: 14,
    fontFamily: "Inter", fontWeight: 600, durationInFrames: 600, delay: 0, easing: "spring", fps: 30,
    showLegend: true, showGrid: true, showValueLabels: true, showAxis: true, opacity: 1, borderRadius: 0
};

function resetCategory(category) {
    if (!currentJob) return;
    // Lógica simplificada: aplicar defaults
    Object.keys(defaultProps).forEach(k => {
        if (currentJob.props[k] !== undefined) currentJob.props[k] = defaultProps[k];
    });
    renderPropsControls(currentJob.props);
    forceRerender();
}

function renderPropsControls(props) {
    const c = document.getElementById('props-controls');
    c.innerHTML = '';

    const createInput = (label, type, val, onChange) => {
        if (type === 'checkbox') {
            return `<div class="prop-group prop-group-inline">
                <label>${label}</label>
                <input type="checkbox" ${val ? 'checked' : ''} onchange="${onChange}">
            </div>`;
        }
        if (type === 'range') {
            return `<div class="prop-group">
                <div style="display:flex; justify-content:space-between"><label>${label}</label> <span style="font-size:11px;color:#aaa">${val}</span></div>
                <input type="range" min="0" max="1" step="0.1" value="${val}" oninput="this.previousElementSibling.querySelector('span').textContent=this.value; ${onChange}">
            </div>`;
        }
        if (type === 'select') {
            const options = Array.isArray(val.opts) ? val.opts.map(o => `<option value="${o}" ${o == val.curr ? 'selected' : ''}>${o}</option>`).join('') : '';
            return `<div class="prop-group"><label>${label}</label><select onchange="${onChange}">${options}</select></div>`;
        }
        return `<div class="prop-group"><label>${label}</label><input type="${type}" value="${val}" oninput="${onChange}"></div>`;
    };

    const accordion = (id, icon, title, content) => `
        <div class="accordion" id="acc-${id}">
            <button class="accordion-header" onclick="toggleAccordion(this)">
                <span>${icon} ${title}</span>
                <div style="display:flex;align-items:center;gap:8px">
                    <span class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); resetCategory('${id}')">Reset</span>
                    <span class="accordion-icon">▼</span>
                </div>
            </button>
            <div class="accordion-content">${content}</div>
        </div>
    `;

    // 1. Dados
    let dataHtml = '';
    if (props.title !== undefined) dataHtml += createInput('Título', 'text', props.title, `updateProp('title', this.value)`);
    if (props.subtitle !== undefined) dataHtml += createInput('Subtítulo', 'text', props.subtitle, `updateProp('subtitle', this.value)`);
    (props.data || []).forEach((item, i) => {
        dataHtml += createInput(`Label ${i+1}`, 'text', item.label, `updateProp('data', this.value, true, ${i}, 'label')`);
        dataHtml += createInput(`Val ${i+1}`, 'number', item.value, `updateProp('data', parseFloat(this.value), true, ${i}, 'value')`);
    });
    c.innerHTML += accordion('dados', '📊', 'Dados', dataHtml);

    // 2. Cores
    let colorsHtml = '';
    props.backgroundColor = props.backgroundColor !== undefined ? props.backgroundColor : '#0b0b0f';
    props.textColor = props.textColor !== undefined ? props.textColor : '#ffffff';
    props.gridColor = props.gridColor !== undefined ? props.gridColor : '#333333';

    colorsHtml += createInput('Fundo', 'color', props.backgroundColor, `updateProp('backgroundColor', this.value)`);
    colorsHtml += createInput('Texto', 'color', props.textColor, `updateProp('textColor', this.value)`);
    colorsHtml += createInput('Grid/Eixos', 'color', props.gridColor, `updateProp('gridColor', this.value)`);
    
    let dataArr = props.data || [];
    if (dataArr.length > 0) {
        colorsHtml += '<div style="margin:8px 0;width:100%;height:1px;background:var(--border)"></div>';
        if (!props.elementColors) props.elementColors = [...(props.sliceColors||props.colors||[])];
        dataArr.forEach((item, i) => {
            const label = item.label ? item.label.substring(0, 10) + (item.label.length>10?'...':'') : `Item ${i+1}`;
            const color = props.elementColors[i] || (props.colors && props.colors.length ? props.colors[i % props.colors.length] : '#7c6aff');
            props.elementColors[i] = color;
            colorsHtml += createInput(`🎨 ${label}`, 'color', color, `updateProp('elementColors', this.value, true, ${i})`);
        });
    }
    c.innerHTML += accordion('cores', '🎨', 'Cores do Gráfico', colorsHtml);

    // 3. Posição e Tamanho
    let dimHtml = '';
    props.x = props.x || 0;
    props.y = props.y || 0;
    props.scale = props.scale !== undefined ? props.scale : 1;
    
    props.width = props.width !== undefined ? props.width : 1280;
    props.height = props.height !== undefined ? props.height : 720;
    
    dimHtml += createInput('Posição X', 'number', props.x, `updateProp('x', parseFloat(this.value))`);
    dimHtml += createInput('Posição Y', 'number', props.y, `updateProp('y', parseFloat(this.value))`);
    dimHtml += createInput('Largura', 'number', props.width, `updateProp('width', parseFloat(this.value))`);
    dimHtml += createInput('Altura', 'number', props.height, `updateProp('height', parseFloat(this.value))`);
    dimHtml += `<div class="prop-group">
        <div style="display:flex; justify-content:space-between"><label>Escala</label> <span style="font-size:11px;color:#aaa">${props.scale}</span></div>
        <input type="range" min="0.1" max="3" step="0.05" value="${props.scale}" oninput="this.previousElementSibling.querySelector('span').textContent=this.value; updateProp('scale', parseFloat(this.value))">
    </div>`;

    if (props.radius !== undefined) dimHtml += createInput('Radius', 'number', props.radius, `updateProp('radius', parseFloat(this.value))`);
    if (props.barWidth !== undefined) dimHtml += createInput('Bar Width', 'number', props.barWidth, `updateProp('barWidth', parseFloat(this.value))`);
    if (props.gap !== undefined) dimHtml += createInput('Gap', 'number', props.gap, `updateProp('gap', parseFloat(this.value))`);
    c.innerHTML += accordion('dim', '📐', 'Posição e Tamanho', dimHtml);

    // 4. Tipografia
    let typoHtml = '';
    props.titleFontSize = props.titleFontSize !== undefined ? props.titleFontSize : 32;
    props.labelFontSize = props.labelFontSize !== undefined ? props.labelFontSize : 14;
    props.fontFamily = props.fontFamily || 'Inter';
    props.fontWeight = props.fontWeight || 600;

    typoHtml += createInput('Tamanho Título', 'number', props.titleFontSize, `updateProp('titleFontSize', parseFloat(this.value))`);
    typoHtml += createInput('Tamanho Label', 'number', props.labelFontSize, `updateProp('labelFontSize', parseFloat(this.value))`);
    const fonts = ['Inter', 'Roboto', 'Montserrat', 'Arial'];
    typoHtml += createInput('Fonte', 'select', {curr: props.fontFamily, opts: fonts}, `updateProp('fontFamily', this.value)`);
    const weights = [400, 600, 700, 800];
    typoHtml += createInput('Peso (Weight)', 'select', {curr: props.fontWeight, opts: weights}, `updateProp('fontWeight', parseInt(this.value))`);
    if (typoHtml) c.innerHTML += accordion('typo', '✏️', 'Tipografia', typoHtml);

    // 5. Animação
    let animHtml = '';
    props.durationInFrames = props.durationInFrames !== undefined ? props.durationInFrames : 600;
    props.delay = props.delay !== undefined ? props.delay : 0;
    props.easing = props.easing || 'spring';
    props.fps = props.fps || 30;

    animHtml += createInput('Duração (Frames)', 'number', props.durationInFrames, `updateProp('durationInFrames', parseInt(this.value))`);
    animHtml += createInput('Delay', 'number', props.delay, `updateProp('delay', parseInt(this.value))`);
    animHtml += createInput('Easing', 'select', {curr: props.easing, opts: ['ease','spring','linear']}, `updateProp('easing', this.value)`);
    animHtml += createInput('FPS', 'select', {curr: props.fps, opts: [24,30,60]}, `updateProp('fps', parseInt(this.value))`);
    if (animHtml) c.innerHTML += accordion('anim', '🎬', 'Animação', animHtml);

    // 6. Aparência
    let visualHtml = '';
    props.showLegend = props.showLegend !== undefined ? props.showLegend : true;
    props.showGrid = props.showGrid !== undefined ? props.showGrid : true;
    props.showValueLabels = props.showValueLabels !== undefined ? props.showValueLabels : true;
    props.borderRadius = props.borderRadius !== undefined ? props.borderRadius : 0;
    props.opacity = props.opacity !== undefined ? props.opacity : 1;

    visualHtml += createInput('Legenda', 'checkbox', props.showLegend, `updateProp('showLegend', this.checked)`);
    visualHtml += createInput('Grid', 'checkbox', props.showGrid, `updateProp('showGrid', this.checked)`);
    visualHtml += createInput('Valores (Labels)', 'checkbox', props.showValueLabels, `updateProp('showValueLabels', this.checked)`);
    visualHtml += createInput('Border Radius', 'number', props.borderRadius, `updateProp('borderRadius', parseFloat(this.value))`);
    visualHtml += createInput('Opacidade Geral', 'range', props.opacity, `updateProp('opacity', parseFloat(this.value))`);
    if (visualHtml) c.innerHTML += accordion('visual', '🖼️', 'Aparência Geral', visualHtml);

    // Abrir o primeiro accordion por padrão
    document.querySelector('.accordion').classList.add('open');
}

window.copyPropsJson = copyPropsJson;
window.forceRerender = forceRerender;
window.toggleAccordion = toggleAccordion;
window.resetCategory = resetCategory;
window.updateProp = updateProp;

async function forceRerender() {
    if (!currentJob) return;
    const props = currentJob.props;
    showToast('🔄 Re-renderizando...', 'info');
    try {
        const res = await fetch('/rerender', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId: currentJob.id, props })
        });
        if (res.ok) {
            const result = await res.json();
            document.getElementById('player-video').src = `/download/${result.outputFile}?t=${Date.now()}`;
            showToast('✅ Re-renderização concluída!', 'success');
            refreshHistory();
        } else {
            showToast('❌ Erro na re-renderização', 'error');
        }
    } catch { showToast('❌ Falha na conexão', 'error'); }
}

// --- Upload ---
async function handleFileUploads(files) {
    const queue = document.getElementById('upload-queue');
    for (const file of files) {
        if (!file.type.startsWith('image/')) { showToast(`⚠️ Ignorado: ${file.name}`, 'warning'); continue; }
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('preview');
            if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
        };
        reader.readAsDataURL(file);
        const itemId = `upload-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
        queue.insertAdjacentHTML('beforeend', `
            <div id="${itemId}" class="upload-item">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <strong>📎 ${file.name}</strong><span class="status">0%</span>
                </div>
                <div class="upload-progress"><div class="upload-bar" style="width:0%"></div></div>
            </div>`);
        const itemEl = document.getElementById(itemId);
        activeUploads.set(file.name, itemEl);
        try {
            await uploadFileWithProgress(file, itemEl);
            setCardStatus(itemEl, 'processing', '⏳ Na fila...');
        } catch {
            setCardStatus(itemEl, 'error', '❌ Falha no upload');
            setTimeout(() => { itemEl.style.cssText += 'opacity:0'; setTimeout(() => itemEl.remove(), 800); }, 4000);
        }
    }
}

function uploadFileWithProgress(file, element) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('image', file);
        const bar = element.querySelector('.upload-bar');
        const status = element.querySelector('.status');
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const pct = Math.round(e.loaded / e.total * 100);
                bar.style.width = pct + '%';
                status.textContent = pct + '%';
            }
        };
        xhr.onload = () => {
            if (xhr.status === 200) {
                try {
                    const json = JSON.parse(xhr.responseText);
                    // ✅ Troca a chave ANTES do SSE chegar
                    if (json.filename && json.filename !== file.name) {
                        activeUploads.delete(file.name);
                        activeUploads.set(json.filename, element);
                    }
                    resolve(json.filename || null);
                } catch { resolve(null); }
            } else { reject(new Error(`HTTP ${xhr.status}`)); }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.open('POST', '/upload');
        xhr.send(formData);
    });
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    connectSSE();
    refreshHistory();
    const dropzone = document.getElementById('dropzone');
    window.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
    window.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    window.addEventListener('drop', (e) => { e.preventDefault(); dropzone.classList.remove('drag-over'); handleFileUploads(Array.from(e.dataTransfer.files)); });
    window.addEventListener('paste', (e) => {
        const files = [...e.clipboardData.items].filter(i => i.type.startsWith('image/')).map(i => i.getAsFile());
        if (files.length) handleFileUploads(files);
    });
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'file'; hiddenInput.multiple = true; hiddenInput.accept = 'image/png,image/jpeg,image/webp';
    hiddenInput.onchange = (e) => handleFileUploads(Array.from(e.target.files));
    dropzone.addEventListener('click', () => hiddenInput.click());
});

window.openPlayer = openPlayer;
window.closePlayer = closePlayer;
window.rerender = rerender;
