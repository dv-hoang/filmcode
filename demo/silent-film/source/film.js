// silent-film demo
const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// helper
const lerp = (a,b,t)=>a+(b-a)*t;
const clamp = (x,a,b)=>Math.min(b,Math.max(a,x));

// draw stick figure
function drawPerson(x,y,scale=1){
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,scale);
  ctx.strokeStyle='white';
  ctx.lineWidth=8;
  // head
  ctx.beginPath();
  ctx.arc(0,-80,30,0,Math.PI*2);
  ctx.stroke();
  // body
  ctx.beginPath();
  ctx.moveTo(0,-50);
  ctx.lineTo(0,50);
  ctx.stroke();
  // arms
  ctx.beginPath();
  ctx.moveTo(-40,0);
  ctx.lineTo(40,0);
  ctx.stroke();
  // legs
  ctx.beginPath();
  ctx.moveTo(0,50);
  ctx.lineTo(-30,120);
  ctx.moveTo(0,50);
  ctx.lineTo(30,120);
  ctx.stroke();
  ctx.restore();
}

// draw balloon
function drawBalloon(x,y,r){
  ctx.save();
  ctx.translate(x,y);
  ctx.fillStyle='red';
  ctx.beginPath();
  ctx.arc(0,0,r,0,Math.PI*2);
  ctx.fill();
  // string
  ctx.strokeStyle='white';
  ctx.lineWidth=4;
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.lineTo(0,r+50);
  ctx.stroke();
  ctx.restore();
}

// main render
function draw(t){
  ctx.clearRect(0,0,W,H);
  // background
  ctx.fillStyle='black';
  ctx.fillRect(0,0,W,H);

  // ground
  ctx.fillStyle='gray';
  ctx.fillRect(0,H-100,W,100);

  // phases
  if(t<2){
    // title card
    const fadeIn = clamp(t/0.5,0,1);
    const stay = clamp((t-0.5)/1.5,0,1);
    const fadeOut = clamp((t-2)/0.5,0,1);
    const alpha = Math.max(0, Math.min(1, fadeIn, stay, 1-fadeOut));
    ctx.globalAlpha=alpha;
    ctx.fillStyle='white';
    ctx.font='bold 120px sans-serif';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText('A Walk in the Park',W/2,H/2);
    ctx.globalAlpha=1;
    return;
  }

  // walking scene 2-5
  if(t<5){
    const p = (t-2)/3; // 0 to 1
    const x = lerp(200,1600,p);
    const y = H-150;
    const bob = Math.sin(p*2*Math.PI)*5;
    drawPerson(x,y+bob,1);
    return;
  }

  // balloon scene 5-7
  if(t<7){
    const p = (t-5)/2; // 0 to 1
    const x = 1600;
    const y = H-150;
    const bob = Math.sin(p*2*Math.PI)*5;
    drawPerson(x,y+bob,1);
    // balloon rising
    const balloonY = lerp(H-150,200,p);
    const balloonR = lerp(20,40,p);
    drawBalloon(x,balloonY,balloonR);
    return;
  }

  // balloon rises 7-9
  if(t<9){
    const p = (t-7)/2; // 0 to 1
    const x = 1600;
    const y = lerp(H-150,200,p);
    const bob = Math.sin(p*2*Math.PI)*5;
    drawPerson(x,y+bob,1);
    const balloonY = lerp(200,50,p);
    const balloonR = lerp(40,30,p);
    drawBalloon(x,balloonY,balloonR);
    return;
  }

  // fade out 9-10
  const fade = clamp((t-9)/1,0,1);
  ctx.globalAlpha=1-fade;
  // repeat last frame
  const p = 1;
  const x = 1600;
  const y = lerp(H-150,200,1);
  const bob = Math.sin(p*2*Math.PI)*5;
  drawPerson(x,y+bob,1);
  const balloonY = lerp(200,50,1);
  const balloonR = lerp(40,30,1);
  drawBalloon(x,balloonY,balloonR);
  ctx.globalAlpha=1;
}

window.DUR=10;
window.render=draw;
window.READY=true;
