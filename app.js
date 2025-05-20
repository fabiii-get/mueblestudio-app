
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let tool = 'line';
let elements = [];
let dragging = null;
let offsetX = 0, offsetY = 0;
let img = new Image();
let micActive = false;
let recognition;

function setTool(t) {
  tool = t;
}

document.getElementById('imageUpload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      img.onload = function() {
        drawAll();
      }
      img.src = event.target.result;
    }
    reader.readAsDataURL(file);
  }
});

function drawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (img.src) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  for (let el of elements) {
    if (el.type === 'line') {
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(el.x1, el.y1);
      ctx.lineTo(el.x2, el.y2);
      ctx.stroke();
    } else if (el.type === 'rect') {
      ctx.strokeStyle = 'green';
      ctx.strokeRect(el.x, el.y, el.w, el.h);
    } else if (el.type === 'text') {
      ctx.font = '16px Arial';
      ctx.fillStyle = 'red';
      ctx.fillText(el.text, el.x, el.y);
    }
  }
}

canvas.addEventListener('mousedown', (e) => {
  const x = e.offsetX, y = e.offsetY;
  if (tool === 'text') {
    const text = prompt("Texto:");
    if (text) {
      elements.push({ type: 'text', text, x, y });
      drawAll();
    }
  } else if (tool === 'line') {
    elements.push({ type: 'line', x1: x, y1: y, x2: x, y2: y });
    dragging = elements[elements.length - 1];
  } else if (tool === 'rect') {
    elements.push({ type: 'rect', x, y, w: 0, h: 0 });
    dragging = elements[elements.length - 1];
  } else if (tool === 'move') {
    for (let el of elements.slice().reverse()) {
      if (el.type === 'text' && ctx.measureText(el.text).width > 0) {
        const width = ctx.measureText(el.text).width;
        const height = 16;
        if (x >= el.x && x <= el.x + width && y >= el.y - height && y <= el.y) {
          dragging = el;
          offsetX = x - el.x;
          offsetY = y - el.y;
          break;
        }
      } else if (el.type === 'rect' && x >= el.x && x <= el.x + el.w && y >= el.y && y <= el.y + el.h) {
        dragging = el;
        offsetX = x - el.x;
        offsetY = y - el.y;
        break;
      }
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  const x = e.offsetX, y = e.offsetY;
  if (!dragging) return;

  if (tool === 'line' && dragging.type === 'line') {
    dragging.x2 = x;
    dragging.y2 = y;
  } else if (tool === 'rect' && dragging.type === 'rect') {
    dragging.w = x - dragging.x;
    dragging.h = y - dragging.y;
  } else if (tool === 'move') {
    dragging.x = x - offsetX;
    dragging.y = y - offsetY;
  }
  drawAll();
});

canvas.addEventListener('mouseup', () => {
  dragging = null;
});

function downloadImage() {
  const link = document.createElement('a');
  link.download = 'diseno-mueble.png';
  link.href = canvas.toDataURL();
  link.click();
}

function toggleMic() {
  if (!('webkitSpeechRecognition' in window)) {
    alert('Tu navegador no soporta reconocimiento de voz');
    return;
  }

  if (!recognition) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'es-AR';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      if (text.includes('línea')) setTool('line');
      else if (text.includes('caja') || text.includes('rectángulo')) setTool('rect');
      else if (text.includes('texto')) setTool('text');
      else if (text.includes('mover')) setTool('move');
      else if (text.includes('borrar')) setTool('erase');
      else alert('Reconocido: ' + text);
    };
  }

  if (!micActive) {
    recognition.start();
    micActive = true;
    alert('Micrófono activado');
  } else {
    recognition.stop();
    micActive = false;
    alert('Micrófono desactivado');
  }
}
