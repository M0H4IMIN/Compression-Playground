/**
 * algorithms.js
 * Pure algorithm implementations — no DOM, no side effects.
 * Each function takes plain JS values and returns plain JS values.
 */

// ─────────────────────────────────────────────────────────────────────────────
// RUN-LENGTH ENCODING (RLE)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encode a string with RLE.
 * Returns an array of run objects: { char, count, start, end }
 *
 * Example:  "AAABBC"  →  [{char:'A',count:3,start:0,end:3},
 *                          {char:'B',count:2,start:3,end:5},
 *                          {char:'C',count:1,start:5,end:6}]
 */
function encodeRLE(s) {
  if (!s) return [];
  const runs = [];
  let i = 0;
  while (i < s.length) {
    let j = i;
    while (j < s.length && s[j] === s[i]) j++;
    runs.push({ char: s[i], count: j - i, start: i, end: j });
    i = j;
  }
  return runs;
}

/**
 * Count how many tokens the RLE encoding produces.
 * A run of length > 1 becomes 2 tokens (count + char).
 * A single character stays as 1 token.
 */
function rleEncodedLength(runs) {
  return runs.reduce((acc, r) => acc + (r.count > 1 ? 2 : 1), 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// HUFFMAN CODING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a Huffman tree and derive the code table for a string s.
 * Returns { root, codes, freq }
 *   root  — root node of the binary tree
 *   codes — { char: bitstring }  e.g. { 'a': '0', 'b': '10', 'c': '11' }
 *   freq  — { char: count }
 */
function buildHuffman(s) {
  // Step 1: frequency table
  const freq = {};
  for (const c of s) freq[c] = (freq[c] || 0) + 1;

  // Step 2: priority queue (sorted array) of leaf nodes
  const nodes = Object.entries(freq).map(([c, f]) => ({
    char: c, freq: f, left: null, right: null
  }));

  // Edge case: single unique character
  if (nodes.length === 1) {
    nodes.push({ char: null, freq: 0, left: null, right: null });
  }

  // Step 3: merge two smallest until one root remains
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq);
    const left  = nodes.shift();
    const right = nodes.shift();
    nodes.push({
      char: null,
      freq: left.freq + right.freq,
      left,
      right
    });
  }

  const root = nodes[0];

  // Step 4: walk tree to assign binary codes
  const codes = {};
  function walk(node, code) {
    if (!node) return;
    if (node.char !== null) {
      // Leaf node — assign code (handle single-char edge case)
      codes[node.char] = code || '0';
      return;
    }
    walk(node.left,  code + '0');
    walk(node.right, code + '1');
  }
  walk(root, '');

  return { root, codes, freq };
}

/**
 * Encode a string with the given Huffman codes.
 * Returns a bitstring e.g. "0101110010..."
 */
function huffmanEncode(s, codes) {
  return s.split('').map(c => codes[c]).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// LZ77
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encode a string with LZ77.
 * @param {string} s         — input string
 * @param {number} winSize   — sliding window (look-back buffer) size
 *
 * Returns an array of tokens:
 *   Literal:   { type: 'lit',  char, pos }
 *   Reference: { type: 'ref',  offset, length, next, pos }
 *
 * offset = how far back in the buffer the match starts
 * length = how many characters are copied from that position
 * next   = the character immediately after the match
 *
 * Example:  "abracadabra" with winSize=10:
 *   [lit 'a', lit 'b', lit 'r', lit 'a', lit 'c', lit 'a', lit 'd',
 *    ref (7,4,'a')]
 */
function encodeLZ77(s, winSize) {
  const tokens = [];
  let i = 0;

  while (i < s.length) {
    const bufStart = Math.max(0, i - winSize);
    const buf      = s.slice(bufStart, i);

    let bestOffset = 0;
    let bestLength = 0;

    // Search the buffer for the longest match to s[i..]
    for (let off = 1; off <= buf.length; off++) {
      let len = 0;
      // Allow overlapping matches via modular index into buf
      while (
        i + len < s.length &&
        buf[buf.length - off + (len % off)] === s[i + len]
      ) {
        len++;
      }
      if (len > bestLength) {
        bestLength = len;
        bestOffset = off;
      }
    }

    if (bestLength > 1) {
      const next = s[i + bestLength] || '';
      tokens.push({ type: 'ref', offset: bestOffset, length: bestLength, next, pos: i });
      i += bestLength + (next ? 1 : 0);
    } else {
      tokens.push({ type: 'lit', char: s[i], pos: i });
      i++;
    }
  }

  return tokens;
}

/**
 * Estimate the byte cost of an LZ77 token stream.
 * Ref tokens cost 3 units (offset + length + char).
 * Lit tokens cost 1 unit.
 */
function lz77EncodedLength(tokens) {
  return tokens.reduce((acc, t) => acc + (t.type === 'ref' ? 3 : 1), 0);
}
