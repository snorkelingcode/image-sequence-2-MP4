const { ipcRenderer } = require('electron');

let selectedFiles = [];
let outputFile = '';

document.getElementById('minimize').addEventListener('click', () => ipcRenderer.send('minimize-window'));
document.getElementById('maximize').addEventListener('click', () => ipcRenderer.send('maximize-window'));
document.getElementById('close').addEventListener('click', () => ipcRenderer.send('close-window'));

document.getElementById('select-files-btn').addEventListener('click', () => {
  ipcRenderer.invoke('select-files').then((files) => {
    if (files && files.length > 0) {
      selectedFiles = files;
      document.getElementById('files-selected').textContent = `${files.length} files selected.`;
    }
  });
});

document.getElementById('select-output-btn').addEventListener('click', () => {
  ipcRenderer.invoke('select-output').then((filePath) => {
    if (filePath) {
      outputFile = filePath;
      document.getElementById('output-path').textContent = filePath;
    }
  });
});

document.getElementById('convert-btn').addEventListener('click', () => {
  const framerate = document.getElementById('framerate').value;
  if (selectedFiles.length === 0 || !outputFile) {
    document.getElementById('status').textContent = "Please select image files and output file.";
    return;
  }

  ipcRenderer.send('convert-video', { selectedFiles, outputFile, framerate });
  document.getElementById('status').textContent = "Processing...";
  document.getElementById('progress-bar').style.width = "0%";
});

ipcRenderer.on('conversion-progress', (event, percent) => {
  document.getElementById('progress-bar').style.width = percent + "%";
});

ipcRenderer.on('conversion-result', (event, message) => {
  document.getElementById('status').textContent = message;
  document.getElementById('progress-bar').style.width = "100%";
});
