/**
 * app.js
 * All DOM manipulation, rendering, and event wiring.
 * Calls pure functions from algorithms.js — never touches algorithm logic.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TAB SWITCHING
// ─────────────────────────────────────────────────────────────────────────────

function switchTab(name) {
  const names = ['rle', 'huffman', 'lz77', 'compare'];
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', names[i] === name);
  });
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');

  // Re-run to refresh visualizations on tab switch
  if (name === 'rle')     runRLE();
  if (name === 'huffman') runHuffman();
  if (name === 'lz77')    runLZ77();
  if (name === 'compare') runCompare();
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update a stats row: original, encoded, ratio.
 * Also update the ratio bar fill and color.
 */
function updateStats(origId, compId, ratioId, barId, orig, enc) {
  const ratio = enc / orig;
  document.getElementById(origId).textContent  = orig;
  document.getElementById(compId).textContent  = enc;
  document.getElementById(ratioId).textContent = ratio.toFixed(2) + 'x';

  // Bar: 50% width = no change; fill = 0% means perfect compression
  const pct = Math.max(5, Math.min(95, Math.round((1 - ratio) * 100 + 50)));
  const bar = document.getElementById(barId);
  bar.style.width = pct + '%';
  bar.className   = 'ratio-fill' + (ratio > 1 ? ' poor' : '');
}

/** Display character; replace space with visible dot */
function displayChar(c) {
  return c === ' ' ? '·' : c;
}

/** Create a DOM element with class and optional inner HTML */
function el(tag, cls, html) {
  const d = document.createElement(tag);
  if (cls)  d.className = cls;
  if (html) d.innerHTML = html;
  return d;
}

// ─────────────────────────────────────────────────────────────────────────────
// RLE PANEL
// ─────────────────────────────────────────────────────────────────────────────

function runRLE() {
  const s = document.getElementById('rle-input').value;
  if (!s) return;

  const runs  = encodeRLE(s);
  const orig  = s.length;
  const enc   = rleEncodedLength(runs);

  updateStats('rle-orig', 'rle-comp', 'rle-ratio', 'rle-bar', orig, enc);

  // ── Input chars coloured by run membership ──────────────────────────────
  const charsEl = document.getElementById('rle-chars-vis');
  charsEl.innerHTML = '';

  runs.forEach(run => {
    for (let i = 0; i < run.count; i++) {
      let cls = 'rle-char pop ';
      if (run.count === 1) {
        cls += 'single';
      } else if (i === 0) {
        cls += 'run-start';
      } else if (i === run.count - 1) {
        cls += 'run-end';
      } else {
        cls += 'run-mid';
      }
      const d = el('div', cls);
      d.textContent = displayChar(run.char);
      charsEl.appendChild(d);
    }
  });

  // ── Encoded token pairs ─────────────────────────────────────────────────
  const encEl = document.getElementById('rle-enc-vis');
  encEl.innerHTML = '';

  runs.forEach(run => {
    const p = el('div', 'rle-pair pop');
    if (run.count > 1) {
      p.innerHTML =
        `<span class="cnt">${run.count}</span>` +
        `<span class="ch">${displayChar(run.char)}</span>`;
    } else {
      p.innerHTML = `<span class="ch">${displayChar(run.char)}</span>`;
    }
    encEl.appendChild(p);
  });

  document.getElementById('rle-enc-len').textContent = enc + ' tokens';
}

// ─────────────────────────────────────────────────────────────────────────────
// HUFFMAN PANEL
// ─────────────────────────────────────────────────────────────────────────────

let _huffTree = null;   // cache for tree re-use

function runHuffman() {
  const s = document.getElementById('huff-input').value;
  if (!s) return;

  const { root, codes, freq } = buildHuffman(s);
  _huffTree = { root, codes, freq };

  const origBits = s.length * 8;
  const encBits  = huffmanEncode(s, codes).length;

  updateStats('huff-orig', 'huff-comp', 'huff-ratio', 'huff-bar', origBits, encBits);

  // ── Code table ──────────────────────────────────────────────────────────
  const sorted  = Object.entries(codes).sort((a, b) => a[1].length - b[1].length);
  const maxFreq = Math.max(...Object.values(freq));
  const tbody   = document.getElementById('huff-tbody');
  tbody.innerHTML = '';

  sorted.forEach(([c, code]) => {
    const pct = Math.round((freq[c] / maxFreq) * 100);
    const tr  = document.createElement('tr');
    tr.innerHTML =
      `<td><code>${c === ' ' ? 'SPACE' : c}</code></td>` +
      `<td>${freq[c]}</td>` +
      `<td><div class="huff-bar-wrap"><div class="huff-bar" style="width:${pct}%"></div></div></td>` +
      `<span class="code-badge">${code}</span></td>` +
      `<td>${code.length}</td>`;
    tbody.appendChild(tr);
  });

  // ── Bitstream (per-char underlined segments) ────────────────────────────
  const bits = s.split('').map(c =>
    `<span style="color:var(--text);border-bottom:1.5px solid #534AB7;margin-right:2px">${codes[c]}</span>`
  ).join('');
  document.getElementById('huff-bits').innerHTML = bits;

  // ── Tree SVG ─────────────────────────────────────────────────────────────
  drawHuffTree(root);
}

function drawHuffTree(root) {
  const svg = document.getElementById('huff-tree');
  svg.innerHTML = '';

  const W = 340;

  // Assign unique IDs to nodes (WeakMap avoids mutating tree objects)
  const ids = new WeakMap();
  let ctr = 0;
  function getId(n) {
    if (!ids.has(n)) ids.set(n, 'n' + (ctr++));
    return ids.get(n);
  }

  // Layout: recursive binary subdivision of horizontal space
  const positions = {};
  function layout(n, depth, left, right) {
    if (!n) return;
    const x = (left + right) / 2;
    const y = 20 + depth * 48;
    positions[getId(n)] = { x, y, n };
    layout(n.left,  depth + 1, left,           (left + right) / 2);
    layout(n.right, depth + 1, (left + right) / 2, right);
  }
  layout(root, 0, 10, W - 10);

  // Draw edges first (so nodes render on top)
  Object.values(positions).forEach(({ x, y, n }) => {
    [n.left, n.right].forEach((child, side) => {
      if (!child) return;
      const c = positions[getId(child)];
      if (!c) return;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x);  line.setAttribute('y1', y);
      line.setAttribute('x2', c.x); line.setAttribute('y2', c.y);
      line.setAttribute('class', 'tree-edge');
      svg.appendChild(line);

      // Edge label (0 for left, 1 for right)
      const lx = side === 0 ? (x + c.x) / 2 - 6 : (x + c.x) / 2 + 6;
      const ly = (y + c.y) / 2;
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', lx); t.setAttribute('y', ly);
      t.setAttribute('class', 'tree-label');
      t.textContent = side === 0 ? '0' : '1';
      svg.appendChild(t);
    });
  });

  // Draw nodes
  Object.values(positions).forEach(({ x, y, n }) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', n.char !== null ? 'tree-node tree-leaf' : 'tree-node');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', n.char !== null ? 14 : 11);
    g.appendChild(circle);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x); text.setAttribute('y', y);
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('style', 'font-size:9px;fill:var(--text)');
    text.textContent = n.char !== null
      ? (n.char === ' ' ? '·' : n.char)
      : n.freq;
    g.appendChild(text);

    svg.appendChild(g);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// LZ77 PANEL
// ─────────────────────────────────────────────────────────────────────────────

let _lzTokens = [];
let _lzInput  = '';

function runLZ77() {
  _lzInput  = document.getElementById('lz-input').value;
  const win = parseInt(document.getElementById('lz-win').value) || 10;
  _lzTokens = encodeLZ77(_lzInput, win);

  const orig  = _lzInput.length;
  const enc   = lz77EncodedLength(_lzTokens);

  updateStats('lz-orig', 'lz-toks', 'lz-ratio', 'lz-bar', orig, enc);

  // ── Token stream ─────────────────────────────────────────────────────────
  const stream = document.getElementById('lz-stream');
  stream.innerHTML = '';

  _lzTokens.forEach((tok, idx) => {
    const d = el('div', 'lz-tok pop');
    d.style.animationDelay = (idx * 0.015) + 's';

    if (tok.type === 'ref') {
      d.innerHTML =
        `<div class="triple">` +
        `<div class="box boff">${tok.offset}</div>` +
        `<div class="box blen">${tok.length}</div>` +
        `<div class="box bchar">${displayChar(tok.next) || '∅'}</div>` +
        `</div><div class="tlbl">o,l,c</div>`;
    } else {
      d.innerHTML =
        `<div class="triple">` +
        `<div class="box bchar">${displayChar(tok.char)}</div>` +
        `</div><div class="tlbl">lit</div>`;
    }

    d.onclick = () => {
      document.getElementById('lz-step').value = idx;
      renderLZStep(idx);
    };
    stream.appendChild(d);
  });

  // Sync step slider range
  const slider = document.getElementById('lz-step');
  slider.max   = Math.max(0, _lzTokens.length - 1);
  slider.value = 0;
  renderLZStep(0);
}

/**
 * Show the sliding window state at token index idx.
 * Buffer = chars before current position, Lookahead = chars after.
 */
function renderLZStep(idx) {
  document.getElementById('lz-step-v').textContent = idx;
  if (!_lzTokens.length) return;

  const tok = _lzTokens[Math.min(idx, _lzTokens.length - 1)];
  const win = parseInt(document.getElementById('lz-win').value) || 10;

  const pos      = tok.pos;
  const bufStart = Math.max(0, pos - win);
  const buf      = _lzInput.slice(bufStart, pos);
  const look     = _lzInput.slice(pos, pos + 14);

  document.getElementById('lz-window-vis').innerHTML =
    `<span style="color:var(--hint);font-size:11px">BUFFER </span>` +
    `<span class="w-buf">${buf || '(empty)'}</span>` +
    `&nbsp;&nbsp;` +
    `<span style="color:var(--hint);font-size:11px">| LOOKAHEAD </span>` +
    `<span class="w-look">${look}</span>`;

  // Highlight selected token
  document.querySelectorAll('.lz-tok').forEach((el, i) => {
    el.style.outline      = i == idx ? '2px solid #534AB7' : 'none';
    el.style.borderRadius = i == idx ? '6px' : '0';
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPARE PANEL
// ─────────────────────────────────────────────────────────────────────────────

let _cmpChart = null;

function runCompare() {
  const s = document.getElementById('cmp-input').value;
  if (!s) return;

  const orig = s.length;

  // RLE
  const rleRuns = encodeRLE(s);
  const rleEnc  = rleEncodedLength(rleRuns);

  // Huffman (convert bits → bytes)
  const { codes } = buildHuffman(s);
  const huffBits  = huffmanEncode(s, codes).length;
  const huffBytes = Math.ceil(huffBits / 8);

  // LZ77 (token count estimate)
  const lzToks = encodeLZ77(s, 10);
  const lzEnc  = lz77EncodedLength(lzToks);

  const algos = [
    { name: 'RLE',     enc: rleEnc,   unit: 'tokens', color: '#1D9E75' },
    { name: 'Huffman', enc: huffBytes, unit: 'bytes',  color: '#534AB7' },
    { name: 'LZ77',    enc: lzEnc,    unit: 'units',  color: '#185FA5' },
  ];

  // ── Per-algo bar cards ────────────────────────────────────────────────────
  const cards = document.getElementById('cmp-cards');
  cards.innerHTML = '';

  algos.forEach(a => {
    const ratio = (a.enc / orig);
    const pct   = Math.min(100, Math.round(ratio * 100));
    const good  = ratio < 1;
    const d = el('div', 'card');
    d.innerHTML =
      `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">` +
        `<span style="font-size:13px;font-weight:500">${a.name}</span>` +
        `<span style="font-size:12px;color:var(--muted)">${orig} chars → ${a.enc} ${a.unit} ` +
          `<strong style="color:${good ? '#1D9E75' : '#D85A30'}">${ratio.toFixed(2)}x</strong>` +
        `</span>` +
      `</div>` +
      `<div class="ratio-bar">` +
        `<div style="height:100%;width:${pct}%;background:${a.color};border-radius:4px;transition:width .5s"></div>` +
      `</div>`;
    cards.appendChild(d);
  });

  // ── Chart.js bar chart ────────────────────────────────────────────────────
  if (_cmpChart) { _cmpChart.destroy(); _cmpChart = null; }

  const ratios = algos.map(a => parseFloat((a.enc / orig).toFixed(3)));

  _cmpChart = new Chart(document.getElementById('cmp-chart'), {
    type: 'bar',
    data: {
      labels: algos.map(a => a.name),
      datasets: [{
        label: 'Compression ratio (lower = better)',
        data: ratios,
        backgroundColor: algos.map(a => a.color + 'cc'),
        borderColor:     algos.map(a => a.color),
        borderWidth: 1,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => ' ratio: ' + c.raw } }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'ratio (1.0 = no change)', font: { size: 11 } },
          ticks: { callback: v => v.toFixed(1) + 'x' }
        }
      }
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIALISE on page load
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  runRLE();
  runHuffman();
  runLZ77();
});
