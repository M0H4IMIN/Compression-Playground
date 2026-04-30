// ============================================
// APP.JS - DOM RENDERING + FILE I/O + MEMORY
// ============================================

// Global state
let currentFile = null;
let currentFileContent = '';
let compareChart = null;

// Format bytes for display
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Calculate memory estimates (in bytes)
function calculateMemory(type, inputLength, outputLength) {
    const base = 1024; // Base unit for visualization
    const maxMem = base * 4; // Max 4KB for visualization

    switch (type) {
        case 'rle':
            return {
                input: Math.min(inputLength * 2, maxMem),
                work: Math.min(inputLength * 0.5, maxMem),
                output: Math.min(outputLength * 4, maxMem)
            };
        case 'huffman':
            return {
                input: Math.min(inputLength * 2, maxMem),
                work: Math.min(inputLength * 8, maxMem), // Tree uses more memory
                output: Math.min(outputLength / 8, maxMem)
            };
        case 'lz77':
            return {
                input: Math.min(inputLength * 2, maxMem),
                work: Math.min(inputLength * 4, maxMem), // Sliding window
                output: Math.min(outputLength * 6, maxMem) // Tokens are larger
            };
        default:
            return { input: 0, work: 0, output: 0 };
    }
}

// Update memory visualization
function updateMemory(prefix, mem) {
    const maxMem = 4096; // 4KB max for visualization

    const inputPct = Math.min((mem.input / maxMem) * 100, 100);
    const workPct = Math.min((mem.work / maxMem) * 100, 100);
    const outputPct = Math.min((mem.output / maxMem) * 100, 100);

    document.getElementById(`${prefix}-mem-input`).style.width = `${inputPct}%`;
    document.getElementById(`${prefix}-mem-input-val`).textContent = formatBytes(mem.input);
    document.getElementById(`${prefix}-mem-work`).style.width = `${workPct}%`;
    document.getElementById(`${prefix}-mem-work-val`).textContent = formatBytes(mem.work);
    document.getElementById(`${prefix}-mem-output`).style.width = `${outputPct}%`;
    document.getElementById(`${prefix}-mem-output-val`).textContent = formatBytes(mem.output);
}

// Update stats cards
function updateStats(containerId, stats) {
    const container = document.getElementById(containerId);
    container.innerHTML = stats.map(stat => `
        <div class="stat-card ${stat.ratio > 1 ? 'warning' : 'success'}">
            <div class="stat-value">${stat.value}</div>
            <div class="stat-label">${stat.label}</div>
        </div>
    `).join('');
}

// RLE Visualization
function renderRLE(text) {
    const { runs, ratio } = encodeRLE(text);

    // Render character visualization
    const vizContainer = document.getElementById('rle-viz');
    vizContainer.innerHTML = '';

    runs.forEach((run, idx) => {
        for (let i = 0; i < run.count; i++) {
            const span = document.createElement('span');
            span.className = 'rle-char';

            if (run.count === 1) {
                span.classList.add('single');
            } else if (i === 0) {
                span.classList.add('run-start');
            } else if (i === run.count - 1) {
                span.classList.add('run-end');
            } else {
                span.classList.add('run-middle');
            }

            span.textContent = run.char === ' ' ? '␣' : run.char;
            span.style.animationDelay = `${idx * 0.05 + i * 0.02}s`;
            vizContainer.appendChild(span);
        }
    });

    // Render encoded output
    const encodedDiv = document.createElement('div');
    encodedDiv.style.marginTop = '20px';
    encodedDiv.innerHTML = '<strong>Encoded Output:</strong>';

    runs.forEach(run => {
        const span = document.createElement('span');
        span.className = 'rle-encoded';
        span.innerHTML = `<span class="rle-count">${run.count}</span>${run.char === ' ' ? '␣' : run.char}`;
        encodedDiv.appendChild(span);
    });

    vizContainer.appendChild(encodedDiv);

    // Update stats
    updateStats('rle-stats', [
        { value: text.length, label: 'Original Chars' },
        { value: runs.length, label: 'Encoded Tokens' },
        { value: ratio.toFixed(3), label: 'Compression Ratio' }
    ]);

    // Update memory
    const mem = calculateMemory('rle', text.length, runs.length);
    updateMemory('rle', mem);

    return { original: text.length, compressed: runs.length, ratio };
}

// Huffman Visualization
function renderHuffman(text) {
    const { freq, tree, codes, encoded, bits } = buildHuffman(text);

    // Draw tree
    const svg = document.getElementById('huffman-tree');
    const layout = drawHuffmanTreeLayout(tree);

    if (layout.nodes.length === 0) {
        svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="var(--text-muted)">No data</text>';
    } else {
        const maxX = Math.max(...layout.nodes.map(n => n.x));
        const maxY = Math.max(...layout.nodes.map(n => n.y));

        svg.setAttribute('viewBox', `0 0 ${Math.max(maxX + 50, 400)} ${Math.max(maxY + 50, 200)}`);

        let svgContent = '';

        // Draw edges first
        layout.edges.forEach(edge => {
            const from = layout.nodes.find(n => n.id === edge.from);
            const to = layout.nodes.find(n => n.id === edge.to);
            if (from && to) {
                svgContent += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" />`;
                svgContent += `<text x="${(from.x + to.x) / 2 - 5}" y="${(from.y + to.y) / 2 - 5}" fill="var(--text-muted)" font-size="10">${edge.label}</text>`;
            }
        });

        // Draw nodes
        layout.nodes.forEach(node => {
            svgContent += `<circle cx="${node.x}" cy="${node.y}" r="20" class="${node.isLeaf ? 'leaf' : ''}" />`;
            svgContent += `<text x="${node.x}" y="${node.y + 4}" text-anchor="middle" fill="white" font-weight="bold">${node.char === ' ' ? '␣' : node.char || ''}</text>`;
        });

        svg.innerHTML = svgContent;
    }

    // Draw code table
    const codeTable = document.getElementById('huffman-codes');
    codeTable.innerHTML = Object.entries(codes).map(([char, code]) => `
        <div class="code-entry">
            <div class="code-char">${char === ' ' ? 'Space' : char}</div>
            <div class="code-bits">${code}</div>
            <div class="code-bits" style="font-size: 0.75rem">freq: ${freq[char]}</div>
        </div>
    `).join('');

    // Draw bitstream
    const bitstream = document.getElementById('huffman-bitstream');
    bitstream.innerHTML = '';

    for (const char of text) {
        const group = document.createElement('span');
        group.className = 'bit-group';
        group.textContent = codes[char];
        group.style.borderBottomColor = `hsl(${char.charCodeAt(0) * 137.508 % 360}, 70%, 50%)`;
        bitstream.appendChild(group);
    }

    // Update stats
    const originalBits = text.length * 8;
    const ratio = bits / originalBits;

    updateStats('huffman-stats', [
        { value: text.length, label: 'Characters' },
        { value: bits, label: 'Compressed Bits' },
        { value: ratio.toFixed(3), label: 'Compression Ratio' }
    ]);

    // Update memory (output is bits/8 for bytes)
    const mem = calculateMemory('huffman', text.length, bits);
    updateMemory('huff', mem);

    return { original: originalBits / 8, compressed: Math.ceil(bits / 8), ratio };
}

// LZ77 Visualization
function renderLZ77(text) {
    const { tokens, ratio } = encodeLZ77(text);

    // Update step slider
    const stepSlider = document.getElementById('lz77-step');
    stepSlider.max = Math.max(0, tokens.length - 1);
    stepSlider.value = 0;
    document.getElementById('lz77-step-display').textContent = `0 / ${tokens.length}`;

    // Render tokens
    const tokenContainer = document.getElementById('lz77-tokens');
    tokenContainer.innerHTML = '';

    tokens.forEach((token, idx) => {
        const div = document.createElement('div');
        div.className = `token ${token.type === 'lit' ? 'token-lit' : 'token-ref'}`;
        div.dataset.index = idx;

        if (token.type === 'lit') {
            div.textContent = `Lit: '${token.char === ' ' ? '␣' : token.char}'`;
        } else {
            div.textContent = `(${token.offset}, ${token.length}, '${token.nextChar === ' ' ? '␣' : token.nextChar}')`;
        }

        div.addEventListener('click', () => {
            stepSlider.value = idx;
            renderLZ77Step(text, idx);
        });

        tokenContainer.appendChild(div);
    });

    // Initial step render
    renderLZ77Step(text, 0);

    // Update stats
    updateStats('lz77-stats', [
        { value: text.length, label: 'Original Chars' },
        { value: tokens.length, label: 'Tokens' },
        { value: ratio.toFixed(3), label: 'Compression Ratio' }
    ]);

    // Update memory
    const mem = calculateMemory('lz77', text.length, tokens.length * 3);
    updateMemory('lz77', mem);

    return { original: text.length, compressed: tokens.length * 3, ratio };
}

function renderLZ77Step(text, stepIndex) {
    const { tokens } = encodeLZ77(text);
    const { buffer, lookahead } = getLZ77BufferAndLookahead(text, stepIndex);

    document.getElementById('lz77-buffer').textContent = buffer || '(empty)';
    document.getElementById('lz77-lookahead').textContent = lookahead || '(empty)';
    document.getElementById('lz77-step-display').textContent = `${Math.min(stepIndex + 1, tokens.length)} / ${tokens.length}`;

    // Highlight selected token
    document.querySelectorAll('.token').forEach((el, idx) => {
        el.classList.toggle('highlight', idx === stepIndex);
    });
}

// Compare Tab
function renderCompare(text) {
    const rle = renderRLE(text);
    const huffman = renderHuffman(text);
    const lz77 = renderLZ77(text);

    const ctx = document.getElementById('compare-chart').getContext('2d');

    if (compareChart) {
        compareChart.destroy();
    }

    compareChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['RLE', 'Huffman', 'LZ77'],
            datasets: [{
                label: 'Compressed Size (bytes)',
                data: [rle.compressed, huffman.compressed, lz77.compressed],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(245, 158, 11, 0.8)'
                ],
                borderColor: [
                    'rgb(34, 197, 94)',
                    'rgb(168, 85, 247)',
                    'rgb(245, 158, 11)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Compression Comparison (lower is better)',
                    color: getComputedStyle(document.body).getPropertyValue('--text')
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') },
                    grid: { color: getComputedStyle(document.body).getPropertyValue('--border') }
                },
                x: {
                    ticks: { color: getComputedStyle(document.body).getPropertyValue('--text') },
                    grid: { display: false }
                }
            }
        }
    });

    // Update compare stats
    const sizes = [
        { name: 'RLE', size: rle.compressed, ratio: rle.ratio },
        { name: 'Huffman', size: huffman.compressed, ratio: huffman.ratio },
        { name: 'LZ77', size: lz77.compressed, ratio: lz77.ratio }
    ];

    const minRatio = Math.min(...sizes.map(s => s.ratio));
    const winner = sizes.filter(s => s.ratio === minRatio).map(s => s.name).join(' / ');

    document.getElementById('compare-stats').innerHTML = sizes.map(s => `
        <div class="compare-stat">
            <h4>${s.name}</h4>
            <div class="value ${s.ratio === minRatio ? 'winner' : ''}">${formatBytes(s.size)}</div>
            <div style="color: var(--text-muted); font-size: 0.85rem">Ratio: ${s.ratio.toFixed(3)}</div>
        </div>
    `).join('') + `<div style="grid-column: 1/-1; text-align: center; margin-top: 10px; color: var(--success);"><strong>Best: ${winner}</strong></div>`;
}

// File I/O Functions
function handleFileUpload(file) {
    if (!file) return;

    currentFile = file;
    const reader = new FileReader();

    reader.onload = function(e) {
        currentFileContent = e.target.result;

        // Update file info display
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = formatBytes(file.size);
        document.getElementById('fileType').textContent = file.type || 'text/plain';

        // Populate all textareas
        document.getElementById('rle-input').value = currentFileContent;
        document.getElementById('huffman-input').value = currentFileContent;
        document.getElementById('lz77-input').value = currentFileContent;
        document.getElementById('compare-input').value = currentFileContent;

        // Enable download button
        document.getElementById('downloadBtn').disabled = false;

        // Run all visualizations
        runRLE();
        runHuffman();
        runLZ77();
    };

    reader.readAsText(file);
}

function downloadCompressed(algorithm = 'rle') {
    if (!currentFileContent) return;

    let compressedData = '';
    let extension = '.txt';

    switch (algorithm) {
        case 'rle':
            const rleResult = encodeRLE(currentFileContent);
            compressedData = rleResult.runs.map(r => `${r.count}${r.char}`).join('');
            extension = '.rle';
            break;

        case 'huffman':
            const huffResult = buildHuffman(currentFileContent);
            // Store as JSON with codes and encoded data
            compressedData = JSON.stringify({
                codes: huffResult.codes,
                encoded: huffResult.encoded,
                original: currentFileContent
            }, null, 2);
            extension = '.huff';
            break;

        case 'lz77':
            const lz77Result = encodeLZ77(currentFileContent);
            compressedData = lz77Result.tokens.map(t =>
                t.type === 'lit' ? `L:${t.char}` : `R:${t.offset},${t.length},${t.nextChar}`
            ).join('\n');
            extension = '.lz77';
            break;
    }

    // Create and trigger download
    const blob = new Blob([compressedData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name.replace(/\.[^/.]+$/, '') + extension;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Tab switching
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    document.getElementById(`${tabId}-tab`).classList.add('active');

    // Re-run visualization for active tab
    const input = document.getElementById(`${tabId}-input`);
    if (input && input.value) {
        if (tabId === 'compare') {
            renderCompare(input.value);
        } else if (tabId === 'rle') {
            runRLE();
        } else if (tabId === 'huffman') {
            runHuffman();
        } else if (tabId === 'lz77') {
            runLZ77();
        }
    }
}

// Event handlers
function runRLE() {
    const text = document.getElementById('rle-input').value;
    renderRLE(text);
}

function runHuffman() {
    const text = document.getElementById('huffman-input').value;
    renderHuffman(text);
}

function runLZ77() {
    const text = document.getElementById('lz77-input').value;
    renderLZ77(text);
}

function runCompare() {
    const text = document.getElementById('compare-input').value;
    renderCompare(text);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // File upload
    document.getElementById('fileUpload').addEventListener('change', (e) => {
        handleFileUpload(e.target.files[0]);
    });

    // Download button
    document.getElementById('downloadBtn').addEventListener('click', () => {
        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        downloadCompressed(activeTab === 'compare' ? 'rle' : activeTab);
    });

    // LZ77 step slider
    document.getElementById('lz77-step').addEventListener('input', (e) => {
        const text = document.getElementById('lz77-input').value;
        renderLZ77Step(text, parseInt(e.target.value));
    });

    // Textarea live updates
    document.getElementById('rle-input').addEventListener('input', runRLE);
    document.getElementById('huffman-input').addEventListener('input', runHuffman);
    document.getElementById('lz77-input').addEventListener('input', runLZ77);
    document.getElementById('compare-input').addEventListener('input', runCompare);
});
