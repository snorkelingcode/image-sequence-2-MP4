const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const sharp = require('sharp');
const os = require('os');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 500,
    icon: path.join(__dirname, 'public/icon.png'),
    webPreferences: { nodeIntegration: true, contextIsolation: false },
    frame: false
  });

  mainWindow.loadFile('index.html');

  // Window controls
  ipcMain.on('minimize-window', () => mainWindow.minimize());
  ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.on('close-window', () => mainWindow.close());

  // Select PNG files
  ipcMain.handle('select-files', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'PNG Images', extensions: ['png'] }]
    });
    return result.canceled ? null : result.filePaths;
  });

  // Select output mp4 path
  ipcMain.handle('select-output', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [{ name: 'MP4 Files', extensions: ['mp4'] }]
    });
    return result.canceled ? null : result.filePath;
  });

  // Enhanced image preprocessing
  async function preprocessImages(files, tempDir) {
    const processedFiles = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const outputPath = path.join(tempDir, `processed_${String(i + 1).padStart(4, '0')}.png`);
      
      try {
        await sharp(file.path)
          .png({
            compressionLevel: 0,  // no compression for max quality
            adaptiveFiltering: false,
            palette: false
          })
          .sharpen(0.5, 1, 2)     // subtle sharpening for edges
          .toFile(outputPath);
          
        processedFiles.push({
          path: outputPath,
          num: i + 1
        });
        
        // Update progress
        const percent = Math.round((i / files.length) * 30); // 30% for preprocessing
        mainWindow.webContents.send('conversion-progress', percent);
        
      } catch (error) {
        console.error(`Error processing ${file.path}:`, error);
        throw error;
      }
    }
    
    return processedFiles;
  }

  // Convert video with preprocessing
  ipcMain.on('convert-video', async (event, args) => {
    const { selectedFiles, outputFile, framerate } = args;

    const sortedFiles = selectedFiles
      .map(file => ({
        path: file,
        num: parseInt(path.basename(file).match(/^(\d{4})\.png$/)?.[1] || -1)
      }))
      .filter(f => f.num >= 0)
      .sort((a, b) => a.num - b.num);

    if (sortedFiles.length === 0) {
      event.reply('conversion-result', "No valid Blender-style images found (e.g. 0001.png).");
      return;
    }

    // Create temp directory for processed images
    const tempDir = path.join(os.tmpdir(), `video_processing_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      console.log("Preprocessing images for cleaner edges...");
      mainWindow.webContents.send('conversion-progress', 0);
      
      // Preprocess images with Sharp
      const processedFiles = await preprocessImages(sortedFiles, tempDir);
      
      const inputPattern = path.join(tempDir, 'processed_%04d.png');
      const totalFrames = processedFiles.length;
      const finalOutput = outputFile.replace(/\.(mov|mp4)$/i, '.mp4');

      console.log("Creating high-quality MP4 with clean edges...");

      const commandArgs = [
        '-y',
        '-framerate', framerate,
        '-start_number', '1',
        '-i', inputPattern,
        '-c:v', 'libx264',
        '-crf', '10',              // very high quality (lower = better)
        '-preset', 'slow',         
        '-pix_fmt', 'yuv420p',     // universal compatibility
        '-profile:v', 'high',      // widely supported
        '-level', '4.1',           // ensures compatibility
        '-tune', 'stillimage',     // optimized for image sequences
        '-movflags', '+faststart',
        '-x264-params', 'aq-mode=2:aq-strength=0.8', // better quality for detailed areas
        finalOutput
      ];

      console.log("Running FFmpeg with args:", commandArgs.join(' '));

      const ffmpeg = spawn('ffmpeg', commandArgs);

      ffmpeg.stderr.on('data', (data) => {
        const str = data.toString();
        console.log("FFmpeg STDERR:", str);

        const match = str.match(/frame=\s*(\d+)/);
        if (match) {
          const frameNumber = parseInt(match[1]);
          const percent = Math.min(100, 30 + Math.round((frameNumber / totalFrames) * 70)); // 70% for encoding
          mainWindow.webContents.send('conversion-progress', percent);
        }
      });

      ffmpeg.on('close', (code) => {
        // Clean up temp directory
        fs.rmSync(tempDir, { recursive: true, force: true });
        
        if (code === 0) {
          mainWindow.webContents.send('conversion-result', `High-quality conversion complete: ${finalOutput}`);
        } else {
          mainWindow.webContents.send('conversion-result', `FFmpeg exited with code ${code}`);
        }
      });

    } catch (error) {
      console.error("Processing error:", error);
      fs.rmSync(tempDir, { recursive: true, force: true });
      event.reply('conversion-result', `Error: ${error.message}`);
    }
  });
}

app.on('ready', createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });