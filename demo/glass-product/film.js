window.DUR=10;
window.READY=true;
function draw(ctx, t){
  const w=ctx.canvas.width, h=ctx.canvas.height;
  ctx.clearRect(0,0,w,h);
  // background
  ctx.fillStyle='#111';
  ctx.fillRect(0,0,w,h);
  // bottle base
  ctx.save();
  ctx.translate(w/2,h*0.8);
  ctx.scale(1,1);
  ctx.beginPath();
  ctx.moveTo(0,-h*0.4);
  ctx.bezierCurveTo(-h*0.15,-h*0.4,-h*0.15,-h*0.2,0,-h*0.2);
  ctx.bezierCurveTo(h*0.15,-h*0.2,h*0.15,-h*0.4,0,-h*0.4);
  ctx.closePath();
  ctx.fillStyle='rgba(200,200,255,0.2)';
  ctx.fill();
  ctx.strokeStyle='rgba(200,200,255,0.5)';
  ctx.lineWidth=2;
  ctx.stroke();
  // bottle body
  ctx.beginPath();
  ctx.moveTo(0,-h*0.4);
  ctx.lineTo(0,-h*0.8);
  ctx.bezierCurveTo(-h*0.1,-h*0.8,-h*0.1,-h*0.6,0,-h*0.6);
  ctx.bezierCurveTo(h*0.1,-h*0.6,h*0.1,-h*0.8,0,-h*0.8);
  ctx.lineTo(0,-h*0.4);
  ctx.closePath();
  ctx.fillStyle='rgba(200,200,255,0.3)';
  ctx.fill();
  ctx.strokeStyle='rgba(200,200,255,0.6)';
  ctx.lineWidth=2;
  ctx.stroke();
  ctx.restore();
  // light beam
  const beamX = w * (0.2 + 0.6 * t);
  const beamY = h * 0.2;
  const beamWidth = 20;
  const gradient = ctx.createLinearGradient(beamX, beamY, beamX+beamWidth, beamY+beamWidth);
  gradient.addColorStop(0,'rgba(255,255,255,0)');
  gradient.addColorStop(0.5,'rgba(255,255,255,0.4)');
  gradient.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=gradient;
  ctx.beginPath();
  ctx.moveTo(beamX, beamY);
  ctx.lineTo(beamX+beamWidth, beamY);
  ctx.lineTo(beamX+beamWidth, beamY+beamWidth*2);
  ctx.lineTo(beamX, beamY+beamWidth*2);
  ctx.closePath();
  ctx.fill();
  // reflection on glass
  ctx.save();
  ctx.translate(w/2,h*0.8);
  ctx.scale(1,1);
  ctx.beginPath();
  ctx.moveTo(0,-h*0.4);
  ctx.bezierCurveTo(-h*0.15,-h*0.4,-h*0.15,-h*0.2,0,-h*0.2);
  ctx.bezierCurveTo(h*0.15,-h*0.2,h*0.15,-h*0.4,0,-h*0.4);
  ctx.closePath();
  ctx.clip();
  const shine = ctx.createRadialGradient(beamX, beamY, 0, beamX, beamY, beamWidth*3);
  shine.addColorStop(0,'rgba(255,255,255,0.1)');
  shine.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=shine;
  ctx.fillRect(0,0,w,h);
  ctx.restore();
}
window.render=draw;
