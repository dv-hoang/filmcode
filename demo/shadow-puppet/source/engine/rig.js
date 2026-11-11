import { clamp } from '/core/lib.js';
import { blit } from './sprites.js';

export const BODY = {
  shF: { x: 22, y: 18 },
  shB: { x: -16, y: 16 },
  headAt: { x: 4, y: -8 },
  tasselAt: { x: -52, y: -70 },
  l1: 54,
  l2: 48,
  foot: 168,
};

export function localToWorld(pose, p) {
  const R = pose.tilt + pose.trem.r;
  const c = Math.cos(R);
  const s = Math.sin(R);
  const x = p.x * c - p.y * s;
  const y = p.x * s + p.y * c;
  return {
    x: pose.waist.x + pose.trem.x + x * pose.face * pose.sc,
    y: pose.waist.y + pose.trem.y + y * pose.sc,
  };
}

function ik(a, b, l1, l2, bend) {
  let dx = b.x - a.x;
  let dy = b.y - a.y;
  let d = Math.hypot(dx, dy) || 0.001;
  const max = l1 + l2 - 0.8;
  const min = Math.abs(l1 - l2) + 0.8;
  if (d > max) {
    dx *= max / d;
    dy *= max / d;
    d = max;
  }
  if (d < min) {
    const k = min / d;
    dx *= k;
    dy *= k;
    d = min;
  }
  const ang = Math.atan2(dy, dx);
  const cosA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const mid = {
    x: a.x + Math.cos(ang + bend * Math.acos(cosA)) * l1,
    y: a.y + Math.sin(ang + bend * Math.acos(cosA)) * l1,
  };
  return { mid, hand: { x: a.x + dx, y: a.y + dy } };
}

function boneRot(a, b) {
  return Math.atan2(b.x - a.x, b.y - a.y);
}

function rivet(g, x, y) {
  g.save();
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#1a100c';
  g.beginPath();
  g.arc(x, y, 6.5, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#f4e7c8';
  g.beginPath();
  g.arc(x, y, 2.8, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

export function drawPuppet(g, spr, pose) {
  const ikF = ik(BODY.shF, pose.handF, BODY.l1, BODY.l2, pose.bendF);
  const ikB = ik(BODY.shB, pose.handB, BODY.l1, BODY.l2, pose.bendB);
  g.save();
  g.translate(pose.waist.x + pose.trem.x, pose.waist.y + pose.trem.y);
  g.scale(pose.face * pose.sc, pose.sc);
  g.rotate(pose.tilt + pose.trem.r);

  blit(g, spr[pose.armU], BODY.shB.x, BODY.shB.y, boneRot(BODY.shB, ikB.mid));
  blit(g, spr[pose.armF], ikB.mid.x, ikB.mid.y, boneRot(ikB.mid, ikB.hand));

  g.save();
  g.rotate(pose.hem);
  blit(g, spr[pose.robe], 0, 14, 0);
  g.restore();

  blit(g, spr[pose.torso], 0, 0, 0);
  blit(g, spr.collar, 0, -4, 0);

  blit(g, spr[pose.armU], BODY.shF.x, BODY.shF.y, boneRot(BODY.shF, ikF.mid));
  blit(g, spr[pose.armF], ikF.mid.x, ikF.mid.y, boneRot(ikF.mid, ikF.hand));

  g.save();
  g.translate(BODY.headAt.x, BODY.headAt.y);
  g.rotate(pose.headRot);
  blit(g, spr[pose.head], 0, 0, 0);
  if (pose.tassel) {
    g.translate(BODY.tasselAt.x - BODY.headAt.x, BODY.tasselAt.y - BODY.headAt.y);
    g.rotate(pose.tasselRot);
    blit(g, spr.tassel, 0, 0, 0);
  }
  g.restore();

  blit(g, spr.lantern, pose.handB.x + pose.lampOff.x, pose.handB.y + pose.lampOff.y, 0);
  blit(g, spr.joint, BODY.shF.x, BODY.shF.y, 0);
  blit(g, spr.joint, BODY.shB.x, BODY.shB.y, 0);
  blit(g, spr.joint, ikF.mid.x, ikF.mid.y, 0);
  blit(g, spr.joint, ikB.mid.x, ikB.mid.y, 0);
  rivet(g, BODY.shF.x, BODY.shF.y);
  rivet(g, BODY.shB.x, BODY.shB.y);
  rivet(g, ikF.mid.x, ikF.mid.y);
  rivet(g, ikB.mid.x, ikB.mid.y);
  rivet(g, BODY.headAt.x, BODY.headAt.y + 10);
  g.restore();

  const lampLocal = {
    x: pose.handB.x + pose.lampOff.x,
    y: pose.handB.y + pose.lampOff.y + 48,
  };
  return {
    lamp: localToWorld(pose, lampLocal),
    handF: localToWorld(pose, ikF.hand),
    handB: localToWorld(pose, pose.handB),
    neck: localToWorld(pose, BODY.headAt),
  };
}
