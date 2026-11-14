// Broadcast Package Demo – 10s
// window.DUR = 10; window.render = draw; window.READY = true

window.DUR = 10;
window.READY = true;

const FONT = 'Arial';
const COLORS = {
  bg: '#000',
  bug: '#0f0',
  lower: '#222',
  title: '#fff',
  map: '#444',
  quote: '#333',
  text: '#fff',
};

function lerp(a,b,t){return a+(b-a)*t;}
function easeInOut(t){return t<0.5?2*t*t:1-(-2*t+2)*( -2*t+2)/2;}

function draw(ctx, t){
  const w=ctx.canvas.width, h=ctx.canvas.height;
  ctx.fillStyle=COLORS.bg; ctx.fillRect(0,0,w,h);

  // 0-2s: channel bug
  if(t<2){
    const alpha=1; // static
    ctx.globalAlpha=alpha;
    ctx.fillStyle=COLORS.bug;
    ctx.fillRect(20,20,80,40);
    ctx.fillStyle=COLORS.text;
    ctx.font='20px '+FONT;
    ctx.fillText('CH',30,50);
  }

  // 2-4s: lower third
  if(t>=2 && t<4){
    const progress=(t-2)/2;
    const alpha=easeInOut(progress);
    ctx.globalAlpha=alpha;
    const rectW=400, rectH=80;
    ctx.fillStyle=COLORS.lower;
    ctx.fillRect(20,h-rectH-20,rectW,rectH);
    ctx.fillStyle=COLORS.text;
    ctx.font='30px '+FONT;
    ctx.fillText('Breaking News',30,h-40);
  }

  // 4-6s: title slide
  if(t>=4 && t<6){
    const progress=(t-4)/2;
    const x=lerp(-400, w/2-200, progress);
    ctx.fillStyle=COLORS.title;
    ctx.font='60px '+FONT;
    ctx.fillText('Global Markets Rally', x, h/2);
  }

  // 6-8s: map graphic
  if(t>=6 && t<8){
    const progress=(t-6)/2;
    const alpha=easeInOut(progress);
    ctx.globalAlpha=alpha;
    const rectW=600, rectH=400;
    ctx.fillStyle=COLORS.map;
    ctx.fillRect((w-rectW)/2,(h-rectH)/2,rectW,rectH);
    ctx.fillStyle=COLORS.text;
    ctx.font='40px '+FONT;
    ctx.fillText('World Map', w/2-80, h/2+20);
  }

  // 8-10s: quote card
  if(t>=8 && t<10){
    const progress=(t-8)/2;
    const alpha=easeInOut(progress);
    ctx.globalAlpha=alpha;
    const rectW=700, rectH=200;
    ctx.fillStyle=COLORS.quote;
    ctx.fillRect((w-rectW)/2,(h-rectH)/2,rectW,rectH);
    ctx.fillStyle=COLORS.text;
    ctx.font='28px '+FONT;
    const quote='"Innovation distinguishes between a leader and a follower."';
    ctx.fillText(quote, (w-rectW)/2+20, (h-rectH)/2+80);
  }
}

window.render = draw;
