# Visual File Compression Playground

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Made with](https://img.shields.io/badge/Made%20with-HTML%20%7C%20CSS%20%7C%20JavaScript-red)](https://developer.mozilla.org/)
[![OS Course Project](https://img.shields.io/badge/OS%20Course-Project-green)]()

> **An interactive, browser-based educational tool that visualizes file compression algorithms in real-time.** Built for Operating Systems course with **File I/O operations** and **Memory usage tracking** features.

![Project Banner](./assets/banner.png)

---

## 🌟 Features

### Core Algorithms
| Algorithm | Visualization | Best For |
|-----------|---------------|----------|
| **RLE** (Run-Length Encoding) | Color-coded character runs | Images, fax data, repeated sequences |
| **Huffman Coding** | Dynamic binary tree + bitstream | Text with skewed character frequency |
| **LZ77** | Sliding window + token stream | Files with repeated patterns |

### Unique Capabilities
- 🎯 **Live Visualization** — Every keystroke triggers instant re-render of the algorithm state
- 📁 **File I/O** — Upload real files (.txt, .csv, .log) and download compressed output
- 💾 **Memory Tracker** — Watch RAM usage change in real-time (Input Buffer, Working Memory, Output Buffer)
- 📊 **Compare Mode** — Run all three algorithms simultaneously and see which wins
- 🌓 **Dark Mode** — Automatic theme switching based on system preferences
- 🚀 **Zero Dependencies** — Runs entirely in-browser, no backend required

---

## 🚀 Quick Start

### Option 1: Direct Open (Simplest)
```bash
# Navigate to the folder and double-click index.html
# Opens in your default browser — no installation needed
```

### Option 2: Local Server (Recommended)
```bash
# Using Python (pre-installed on most systems)
cd compression-playground-v2
python -m http.server 8080

# Open in browser
http://localhost:8080
```

### Option 3: VS Code Live Server
```bash
# Open folder in VS Code → Install "Live Server" extension
# Right-click index.html → "Open with Live Server"
```

---

## 📁 Project Structure

```
compression-playground-v2/
│
├── index.html              # Page structure, tabs, file upload UI
├── style.css               # Styling, animations, dark mode, responsive
├── algorithms.js           # Pure compression logic (RLE, Huffman, LZ77)
├── app.js                  # DOM rendering, File I/O, Memory tracking
├── README.md               # This file
│
├── assets/                 # Screenshots and demo images
│   ├── screenshot-rle.png
│   ├── screenshot-huffman.png
│   ├── screenshot-lz77.png
│   └── screenshot-compare.png
│
└── dataset/                # Training data for ML model (if applicable)
    └── synthetic_task_dataset.csv
```

---

## 📖 How to Use

### 1. Upload a File or Type Manually
- Click **Upload File** to load a `.txt`, `.csv`, `.log`, or `.json` file
- Or simply start typing in any tab's textarea
- All visualizations update live on every keystroke

### 2. Explore Each Algorithm

#### RLE Tab
```
Input:  AAAAAAAAAABBBBBBBCCC
Output: 10A 7B 3C
```
- Watch green blocks group repeated characters
- See encoded output as count-character pairs
- Observe compression ratio change in real-time

#### Huffman Tab
```
Input:  aaaaabbbcc
Tree:   'a' (freq: 5) → code: 0
        'b' (freq: 3) → code: 10
        'c' (freq: 2) → code: 11
```
- Watch the binary tree redraw itself dynamically
- Frequent characters get shorter codes (climb toward root)
- See the full bitstream with per-character color coding

#### LZ77 Tab
```
Input:  abracadabra abracadabra
Tokens: Lit:'a' Lit:'b' ... Ref:(12, 11, '')
```
- Watch back-reference tokens appear as repeated patterns are found
- Use the **step slider** to scrub through tokens one-by-one
- See the sliding window (buffer + lookahead) update in real-time

#### Compare Tab
- Runs all three algorithms on the same input simultaneously
- Bar chart shows compressed size for direct comparison
- Identifies the winner algorithm for your specific data

### 3. Download Compressed Output
- After uploading a file, click **Download Compressed File**
- Output saves with algorithm-specific extension:
  - `.rle` for RLE
  - `.huff` for Huffman (JSON with codes + encoded data)
  - `.lz77` for LZ77 (token stream)

### 4. Watch Memory Tracker
Each tab displays live memory usage bars:
- **Input Buffer** — Memory allocated for original data
- **Working Memory** — Algorithm's temporary storage (tree, window, etc.)
- **Output Buffer** — Compressed data size

---

## 🧪 Demo Examples

| Input String | Best Algorithm | Why | Expected Ratio |
|--------------|----------------|-----|----------------|
| `AAAAAAAAAAA` | RLE | Long runs of identical chars | ~0.2 (80% reduction) |
| `aaaaabbbcc` | Huffman | Skewed character frequency | ~0.6 (40% reduction) |
| `abracadabra abracadabra` | LZ77 | Repeated patterns | ~0.5 (50% reduction) |
| `abcdefghijk` | None | Varied text (no patterns) | >1.0 (expansion) |

> 💡 **Teaching Tip:** Type `abcdefghijk` in RLE to watch the ratio go above 1.0 — demonstrates when compression makes things worse!

---

## 🛠️ Technical Details

### Algorithms Implemented

#### Run-Length Encoding (RLE)
- **Time Complexity:** O(n)
- **Space Complexity:** O(n)
- **Mechanism:** Single pass with two pointers (i, j) to identify runs
- **Formula:** `ratio = encoded_tokens / original_length`

#### Huffman Coding
- **Time Complexity:** O(n log n) — tree construction via sorting
- **Space Complexity:** O(k) — where k is unique characters
- **Mechanism:** 
  1. Build frequency table in one pass
  2. Construct binary tree by merging lowest-frequency nodes
  3. Assign codes via recursive tree walk (0=left, 1=right)
- **Optimality:** Produces minimum expected code length for symbol-by-symbol coding

#### LZ77
- **Time Complexity:** O(n × w) — where w is window size
- **Space Complexity:** O(w) — sliding window buffer
- **Mechanism:** At each position, search buffer for longest match to lookahead
- **Token Format:** `(offset, length, next_char)` for references, `Lit:char` for literals
- **Overlap Handling:** Modular indexing handles overlapping matches (e.g., `AAAAAA`)

### Memory Estimation
Memory bars visualize approximate RAM usage:
```
RLE:     Input = n×2B, Work = n×0.5B, Output = tokens×4B
Huffman: Input = n×2B, Work = n×8B (tree), Output = bits/8
LZ77:    Input = n×2B, Work = n×4B (window), Output = tokens×6B
```

---

## 📸 Screenshots

### RLE Visualization
![RLE](./assets/screenshot-rle.png)

### Huffman Tree + Bitstream
![Huffman](./assets/screenshot-huffman.png)

### LZ77 Sliding Window
![LZ77](./assets/screenshot-lz77.png)

### Algorithm Comparison
![Compare](./assets/screenshot-compare.png)

---

## 🎓 Operating Systems Concepts Demonstrated

| Concept | Implementation |
|---------|----------------|
| **File I/O Operations** | FileReader API reads uploaded files into memory buffers |
| **Memory Management** | Live tracking of buffer allocation/deallocation |
| **Data Compression** | Core OS optimization technique used in ZIP, gzip, PNG |
| **Algorithm Efficiency** | Time/space tradeoffs visualized in real-time |
| **Sliding Window** | LZ77 demonstrates circular buffer memory pattern |

---

## 🔧 Customization

### Modify Window Size (LZ77)
Open `algorithms.js` and adjust the default window size:
```javascript
function encodeLZ77(s, windowSize = 15) {  // Change 15 to any value
    // ...
}
```

### Add New Algorithms
1. Add algorithm function in `algorithms.js`
2. Create new tab in `index.html`
3. Add rendering logic in `app.js`
4. Update `style.css` if needed

### Change Color Scheme
Edit CSS custom properties in `style.css`:
```css
:root {
    --primary: #4f46e5;      /* Main accent color */
    --success: #22c55e;      /* Good compression */
    --warning: #f59e0b;      /* Ratio > 1.0 */
    --bg: #f5f5f5;           /* Light mode background */
}
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Chart not showing | Check internet connection (Chart.js loads from CDN) |
| Page looks broken | Ensure all 4 files are in the same folder |
| Upload not working | Try a different file type (.txt works best) |
| `python` not recognized | Try `python3 -m http.server 8080` instead |
| Memory bars not moving | Type more text — visualization needs input to render |
| Negative durations | Clear browser cache and reload page |

---

## 📦 Browser Support

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 80+ | Full support |
| Firefox | 75+ | Full support |
| Edge | 80+ | Full support |
| Safari | 13+ | Full support |
| Opera | 67+ | Full support |

---

## 🤝 Contributing

Contributions are welcome! This is an educational project for OS courses.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see below for details.

```
MIT License

Copyright (c) 2026 S.M. MOHAIMIN

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👨‍💻 Author

**S.M. MOHAIMIN**

- GitHub: [@yourusername](https://github.com/yourusername)
- Project: Visual File Compression Playground
- Course: Operating Systems
- Institution: [Your University]

---

## 🙏 Acknowledgments

- **Chart.js** — Bar chart visualization library
- **Operating Systems Course** — Faculty guidance and project requirements
- **Inspired by** — Classic compression algorithm visualizers and interactive educational tools

---

## 📬 Contact

For questions, feedback, or collaboration requests, please open an issue on GitHub or contact me directly.

---

<div align="center">

**Built with ❤️ for the Operating Systems Course**

*Visual File Compression Playground — Making abstract algorithms visible, understandable, and interactive.*

</div>
