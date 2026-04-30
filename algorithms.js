// ============================================
// PURE COMPRESSION ALGORITHMS - NO DOM ACCESS
// ============================================

// Run-Length Encoding
function encodeRLE(s) {
    if (!s || s.length === 0) return { runs: [], ratio: 0 };

    const runs = [];
    let i = 0;

    while (i < s.length) {
        const char = s[i];
        let j = i;

        while (j < s.length && s[j] === char) {
            j++;
        }

        const count = j - i;
        runs.push({
            char: char,
            count: count,
            start: i,
            end: j - 1
        });

        i = j;
    }

    const ratio = runs.length / s.length;
    return { runs, ratio };
}

// Huffman Coding
class HuffmanNode {
    constructor(char, freq) {
        this.char = char;
        this.freq = freq;
        this.left = null;
        this.right = null;
    }
}

function buildHuffman(s) {
    if (!s || s.length === 0) return { freq: {}, tree: null, codes: {}, encoded: '', bits: 0 };

    // Phase 1: Build frequency table
    const freq = {};
    for (const char of s) {
        freq[char] = (freq[char] || 0) + 1;
    }

    // Phase 2: Build tree
    let nodes = Object.keys(freq).map(char => new HuffmanNode(char, freq[char]));

    while (nodes.length > 1) {
        nodes.sort((a, b) => b.freq - a.freq); // Sort descending

        const right = nodes.pop();
        const left = nodes.pop();

        const merged = new HuffmanNode(null, left.freq + right.freq);
        merged.left = left;
        merged.right = right;

        nodes.push(merged);
    }

    const tree = nodes[0];

    // Phase 3: Generate codes
    const codes = {};

    function generateCodes(node, prefix = '') {
        if (!node) return;

        if (node.char !== null) {
            codes[node.char] = prefix || '0';
            return;
        }

        generateCodes(node.left, prefix + '0');
        generateCodes(node.right, prefix + '1');
    }

    generateCodes(tree);

    // Encode the string
    let encoded = '';
    for (const char of s) {
        encoded += codes[char];
    }

    return { freq, tree, codes, encoded, bits: encoded.length };
}

function drawHuffmanTreeLayout(tree) {
    if (!tree) return { nodes: [], edges: [] };

    const nodes = [];
    const edges = [];
    const nodeId = 0;

    function layout(node, depth = 0, minX = 0, maxX = 100) {
        if (!node) return;

        const x = (minX + maxX) / 2;
        const y = depth * 50 + 30;
        const id = `node-${nodes.length}`;

        nodes.push({
            id,
            x,
            y,
            char: node.char,
            freq: node.freq,
            isLeaf: node.char !== null
        });

        if (node.left) {
            edges.push({
                from: id,
                to: `node-${nodes.length}`,
                label: '0'
            });
            layout(node.left, depth + 1, minX, x);
        }

        if (node.right) {
            edges.push({
                from: id,
                to: `node-${nodes.length}`,
                label: '1'
            });
            layout(node.right, depth + 1, x, maxX);
        }
    }

    layout(tree);
    return { nodes, edges };
}

// LZ77 Encoding
function encodeLZ77(s, windowSize = 15) {
    if (!s || s.length === 0) return { tokens: [], ratio: 0 };

    const tokens = [];
    let i = 0;

    while (i < s.length) {
        const bufferStart = Math.max(0, i - windowSize);
        const buffer = s.slice(bufferStart, i);
        const lookahead = s.slice(i);

        let bestOffset = 0;
        let bestLength = 0;

        // Search for longest match in buffer
        for (let offset = 1; offset <= buffer.length; offset++) {
            let length = 0;
            const bufStart = buffer.length - offset;

            while (i + length < s.length &&
                   length < 255 &&
                   s[bufferStart + bufStart + (length % offset)] === s[i + length]) {
                length++;
            }

            if (length > bestLength) {
                bestLength = length;
                bestOffset = offset;
            }
        }

        if (bestLength >= 2) {
            const nextChar = s[i + bestLength] || '';
            tokens.push({
                type: 'ref',
                offset: bestOffset,
                length: bestLength,
                nextChar: nextChar
            });
            i += bestLength + (nextChar ? 1 : 0);
        } else {
            tokens.push({
                type: 'lit',
                char: s[i]
            });
            i++;
        }
    }

    // Calculate ratio (approximate bits)
    const originalBits = s.length * 8;
    let compressedBits = 0;
    for (const token of tokens) {
        if (token.type === 'ref') {
            compressedBits += 8 + 8 + 8; // offset, length, char
        } else {
            compressedBits += 8;
        }
    }

    const ratio = compressedBits / originalBits;
    return { tokens, ratio };
}

function getLZ77BufferAndLookahead(s, tokenIndex, windowSize = 15) {
    // Reconstruct position at given token
    let pos = 0;
    const tokens = encodeLZ77(s, windowSize).tokens;

    for (let i = 0; i <= tokenIndex && i < tokens.length; i++) {
        const token = tokens[i];
        if (token.type === 'ref') {
            pos += token.length + (token.nextChar ? 1 : 0);
        } else {
            pos += 1;
        }
    }

    const bufferStart = Math.max(0, pos - windowSize);
    const buffer = s.slice(bufferStart, pos);
    const lookahead = s.slice(pos, pos + 20); // Show next 20 chars

    return { buffer, lookahead, pos };
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { encodeRLE, buildHuffman, drawHuffmanTreeLayout, encodeLZ77, getLZ77BufferAndLookahead };
}
