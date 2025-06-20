const canvas = document.getElementById('earth');
const worker = new Worker('./worker.js', {type: 'module'});
const offscreen = canvas.transferControlToOffscreen();
worker.postMessage({type: 'init', canvas: offscreen}, [offscreen]);
