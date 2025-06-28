# 🖼️🎞️ **Image Sequence to MP4 Converter**

Convert **Blender-style PNG image sequences** (e.g. `0001.png`, `0002.png`, ...) into **high-quality MP4 videos** with **clean edges and universal playback compatibility**, using Electron + Sharp + FFmpeg.

---

## ✅ **Features**

- Select multiple **PNG files** as input  
- **Preprocesses images** with Sharp for:
  - Maximum quality PNG output (no compression artifacts)  
  - Subtle sharpening to clean up edges from renders  
- **Encodes with FFmpeg libx264**:
  - CRF 10 for near-lossless visual quality  
  - Universal compatibility (Windows Media Player, Unreal Engine, browsers)  
  - Tuned specifically for still image sequences
- **Progress bar updates** for preprocessing and encoding  
- **Output is .mp4** with faststart for streaming

---

## 🚀 **Installation**

1. Clone or download this repository.
2. Install dependencies:

```bash
npm install
```

- Requires **Node.js**, **npm**, **FFmpeg installed globally** (`ffmpeg` in PATH).

---

## 🛠️ **Usage**

1. Run the Electron app:

```bash
npm start
```

2. In the UI:

- **Select PNG files**: Choose all frames of your image sequence (must be named with padded numbers e.g. `0001.png`).
- **Select output file**: Choose where to save the resulting `.mp4`.
- **Click Convert**.

3. The app:

- Preprocesses images with **Sharp** for:
  - No PNG compression (`compressionLevel: 0`)  
  - Subtle sharpening (`.sharpen(0.5, 1, 2)`)
- Encodes using **FFmpeg libx264** with:

```
-crf 10 -preset slow -pix_fmt yuv420p -profile:v high -level 4.1 -tune stillimage
```

- Cleans up temporary files automatically.

---

## 📁 **File structure overview**

```
main.js          # Electron main process with preprocessing + FFmpeg integration
renderer.js      # Renderer process for UI interaction
index.html       # HTML interface
styles.css       # UI styling
package.json     # Project metadata and dependencies
```

---

## ⚠️ **Notes & Limitations**

- Input files **must be Blender-style numbered PNGs** (e.g. `0001.png`, `0002.png`).  
- Outputs **do not include alpha channels**. Transparency is rendered as black by default.
- **FFmpeg must be installed** on your system and accessible in PATH. Download from [ffmpeg.org](https://ffmpeg.org/download.html).

---

## 💡 **Why this works so well**

This pipeline:

1. Uses **Sharp** to re-process Blender PNGs into clean, uncompressed PNGs with improved edge sharpness before encoding.  
2. Uses **libx264 with tuned stillimage mode** to maintain sharp gradients and avoid blurry compression artifacts typical in video encoders.

---

## 👨‍💻 **Developer**

Built by **Dane Knudsen**, optimized for high-end pipelines requiring clean edges, Blender compatibility, and immediate playback on Windows and Unreal Engine.

---

### ✨ **Enjoy clean, professional video exports from your image sequences, with no compromise on visual fidelity.**

