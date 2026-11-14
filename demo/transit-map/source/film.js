// Transit Map Demo – 10s film
// Author: LemoLab (placeholder)
// Style: transit-map

const WIDTH = 1920;
const HEIGHT = 1080;

// Simple octilinear metro network
const lines = [
  {
    name: 'Line A',
    color: '#e41a1c',
    stops: [
      {x: 200, y: 800},
      {x: 400, y: 800},
      {x: 600, y: 600},
      {x: 800, y: 600},
      {x: 1000, y: 400},
      {x: 1200, y: 400},
    ],
  },
  {
    name: 'Line B',
    color: '#377eb8',
    stops: [
      {x: 300, y: 200},
      {x: 500, y: 200},
      {x: 700, y: 400},
      {x: 900, y: 400},
      {x: 1100, y: 600},
      {x: 1300, y: 600},
    ],
  },
  {
    name: 'Line C',
    color: '#4daf4a',
    stops: [
      {x: 100, y: 500},
      {x: 300, y: 500},
      {x: 500, y: 700},
      {x: 700, y: 700},
      {x: 900, y: 900},
      {x: 1100, y: 900},
    ],
  },
];

// Camera keyframes
const cam = {
  start: {x: 0, y: 0, zoom: 1, rot: 0},
  end:   {x: 200, y: 100, zoom: 1.5, rot: Math.PI/30},
};

function lerp(a,b,t){return a+(b-a)*t;}
function easeInOut(t){return t<0.5?2*t*t:(-1+(4-2*t)*t);}

function draw(t){
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const dt = Math.min(Math.max(t/10,0),1);
  const e = easeInOut(dt);

  // Clear
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,WIDTH,HEIGHT);

  // Camera transform
  const cx = lerp(cam.start.x, cam.end.x, e);
  const cy = lerp(cam.start.y, cam.end.y, e);
  const z  = lerp(cam.start.zoom, cam.end.zoom, e);
  const r  = lerp(cam.start.rot, cam.end.rot, e);

  ctx.save();
  ctx.translate(WIDTH/2, HEIGHT/2);
  ctx.rotate(r);
  ctx.scale(z,z);
  ctx.translate(-WIDTH/2+cx, -HEIGHT/2+cy);

  // Draw water band
  ctx.fillStyle = '#004080';
  ctx.fillRect(0, HEIGHT*0.75, WIDTH, HEIGHT*0.25);

  // Draw lines
  lines.forEach(line=>{
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 8;
    ctx.beginPath();
    line.stops.forEach((s,i)=>{
      const x = s.x;
      const y = s.y;
      if(i===0) ctx.moveTo(x,y);
      else ctx.lineTo(x,y);
    });
    ctx.stroke();
    // Stops
    line.stops.forEach(s=>{
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 12, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 4;
      ctx.stroke();
    });
  });

  ctx.restore();
}

window.DUR=10;
window.render=draw;
window.READY=true;
