# Compression Playground

> **A live, interactive visualizer for classic file compression algorithms**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Made with vanilla JS](https://img.shields.io/badge/Made%20with-Vanilla%20JavaScript-f9d71c?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

An educational web application that provides real-time visualizations of three fundamental compression algorithms: **Run-Length Encoding (RLE)**, **Huffman Coding**, and **LZ77**. Built for OS courses and algorithm education.

![Compression Playground Demo](https://via.placeholder.com/800x450/534AB7/ffffff?text=Compression+Playground+Preview)

---

## Table of Contents

- [Features](#features)
- [Live Demo](#live-demo)
- [Algorithms](#algorithms)
  - [Run-Length Encoding (RLE)](#run-length-encoding-rle)
  - [Huffman Coding](#huffman-coding)
  - [LZ77](#lz77)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Features

- **Real-time Visualization** - Watch algorithms process your input character by character
- **Interactive Step-through** - Click through each encoding step to understand the internal mechanics
- **Side-by-side Comparison** - Compare compression ratios of all three algorithms instantly
- **Dark Mode Support** - Automatic theme switching based on system preferences
- **Zero Dependencies** - Pure vanilla JavaScript with only Chart.js for visualization
- **Educational Focus** - Color-coded visual feedback and clear algorithm explanations

---

## Live Demo

Try it out: [https://m0h4imin.github.io/Compression-Playground](https://m0h4imin.github.io/Compression-Playground)

---

## Algorithms

### Run-Length Encoding (RLE)

**Best for:** Long repeated runs (bitmaps, fax data, simple graphics)

RLE replaces consecutive identical characters with a count-character pair. For example:
- Input: `AAAABBBCC`
- Output: `(4,A)(3,B)(2,C)`

**Complexity:** O(n) time, O(n) space

| Scenario | Performance |
|----------|-------------|
| Long runs | Excellent compression |
| Varied text | May expand size |

### Huffman Coding

**Best for:** Text with unequal character frequencies

Huffman builds an optimal binary tree where frequent characters get shorter codes:
- Frequent chars → Short codes (e.g., `e` → `0`)
- Rare chars → Long codes (e.g., `z` → `11101`)

**Complexity:** O(n log n) time for building tree + O(n) for encoding

| Scenario | Performance |
|----------|-------------|
| Skewed frequency | Excellent compression |
| Uniform distribution | No compression gain |

### LZ77

**Best for:** Repetitive sequences, source code, natural language

LZ77 uses a sliding window to find and reference previously seen sequences:
- Matches emit `(offset, length, next_char)` tuples
- Foundation of gzip, deflate, PNG, and ZIP

**Complexity:** O(n × w) where w = window size

| Scenario | Performance |
|----------|-------------|
| Repetitive content | Excellent compression |
| Random data | Minimal overhead |

---

## Installation

### Option 1: Clone the Repository

```bash
git clone https://github.com/M0H4IMIN/Compression-Playground.git
cd Compression-Playground
```

### Option 2: Download ZIP

1. Click the green **Code** button on GitHub
2. Select **Download ZIP**
3. Extract to your preferred location

---

## Usage

### Quick Start (No Installation)

Simply open `index.html` in any modern browser:

```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

### Local Development Server

For the best development experience and to avoid CORS warnings:

**Using Python:**
```bash
cd Compression-Playground
python -m http.server 8080
# Open http://localhost:8080
```

**Using Node.js:**
```bash
cd Compression-Playground
npx serve .
# Open the URL printed in terminal
```

**Using VS Code:**
1. Install the **Live Server** extension
2. Right-click `index.html` → **Open with Live Server**

---

## Project Structure

```
compression-playground/
├── index.html          # HTML structure, tab navigation, panel layouts
├── style.css           # Complete styling with CSS custom properties, dark mode
├── algorithms.js       # Pure algorithm implementations (no DOM access)
├── app.js              # DOM manipulation, event handlers, visualization rendering
└── README.md           # This file
```

### File Responsibilities

| File | Purpose |
|------|---------|
| `algorithms.js` | Pure functions for RLE, Huffman, and LZ77 encoding |
| `app.js` | UI logic, chart rendering, interactive step-through |
| `style.css` | Theming, animations, responsive layout |
| `index.html` | Semantic structure, accessibility attributes |

---

## Architecture

The project follows a **separation of concerns** architecture:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   index.html    │────▶│     app.js       │────▶│  algorithms.js  │
│   (Structure)   │     │   (UI Logic)     │     │  (Pure Logic)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │    style.css     │
                       │  (Presentation)  │
                       └──────────────────┘
```

**Key Design Principles:**
- **Pure functions** in `algorithms.js` - testable in isolation
- **No DOM access** in algorithm code - framework agnostic
- **CSS custom properties** - easy theming and dark mode
- **Event-driven UI** - reactive updates on input changes

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| HTML5 | Semantic document structure |
| CSS3 | Styling with CSS custom properties, flexbox, grid |
| Vanilla JavaScript (ES6+) | All application logic |
| Chart.js 4.4 | Compression ratio visualization |
| SVG | Huffman tree diagram rendering |

**Browser Support:** Chrome, Firefox, Safari, Edge (latest versions)

---

## Screenshots

### RLE Visualization
![RLE Tab](https://via.placeholder.com/800x450/1D9E75/ffffff?text=RLE+Visualization)

### Huffman Tree
![Huffman Tab](https://via.placeholder.com/800x450/534AB7/ffffff?text=Huffman+Coding+Tree)

### LZ77 Sliding Window
![LZ77 Tab](https://via.placeholder.com/800x450/185FA5/ffffff?text=LZ77+Sliding+Window)

### Algorithm Comparison
![Compare Tab](https://via.placeholder.com/800x450/D85A30/ffffff?text=Algorithm+Comparison)

---

## Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Keep algorithm logic pure (no side effects in `algorithms.js`)
- Maintain separation between UI and algorithm code
- Test in both light and dark modes
- Ensure responsive design works on mobile

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 M0H4IMIN

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

## Acknowledgments

- **Huffman, D.A. (1952)** - "A Method for the Construction of Minimum-Redundancy Codes"
- **Ziv, J. & Lempel, A. (1977)** - "A Universal Algorithm for Sequential Data Compression"
- **Chart.js Contributors** - For the excellent charting library
- **OS Course** - This project was developed as part of an Operating Systems course

---

## Author

**M0H4IMIN**

- GitHub: [@M0H4IMIN](https://github.com/M0H4IMIN)
- Repository: [Compression-Playground](https://github.com/M0H4IMIN/Compression-Playground)

---

<div align="center">

**Made with ❤️ for learning**

If you found this project helpful, please consider giving it a ⭐!

</div>
