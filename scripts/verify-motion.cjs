const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,p);
const {ambientFlowPose,evaluateNarrative}=require('../src/three/choreography.ts');
const {processFrame,partnershipReveal}=require('../src/lib/scroll-math.ts');
for(const aspect of [.4,.8,1.6,2.2]){
 let before;
 for(let step=0;step<=1500;step++){
  const p=2.55+step*.001,focus=evaluateNarrative(p,aspect<.8,aspect<1).logo;
  const pose=ambientFlowPose(p,37,aspect,focus);assert(Object.values(pose).every(Number.isFinite));
  if(before)assert(Math.hypot(pose.x-before.x,pose.y-before.y,pose.z-before.z)<.15,'continuous flight');before=pose;
  if(p>=3.08&&p<=3.85){assert(Math.abs(pose.blend-1)<1e-8);assert(Math.hypot((pose.x-focus.x)/Math.min(aspect,1.5),pose.y-focus.y)>=3.14,'clear logo axis');}
  if(p>=3.85)assert(evaluateNarrative(p).ambientOpacity<1e-8,'flight clears before Earth');
 }
 for(let i=0;i<250;i++){let p=3.6,focus=evaluateNarrative(p).logo;const a=ambientFlowPose(p,i,aspect,focus);const b=ambientFlowPose(p,i,aspect,focus);assert.deepEqual(a,b);}
}
for(const starts of [[100,450,800,1150,1500],[2450,2732,3038,3300,3650]]){
 const states=new Map();let last=-1;
 for(let y=starts[0]-100;y<=starts.at(-1)+100;y+=5){const s=processFrame(y,starts);assert(s.progress>=last);last=s.progress;states.set(y,JSON.stringify(s));}
 for(const y of [...states.keys()].reverse())assert.equal(JSON.stringify(processFrame(y,starts)),states.get(y));
 assert.equal(processFrame(starts.at(-1),starts).active,4);assert.equal(processFrame(starts.at(-1),starts).progress,1);assert.equal(processFrame(starts[0],starts).progress,0);
}
for(let i=0;i<6;i++){assert.equal(partnershipReveal(0,i),0);assert.equal(partnershipReveal(.8,i),1);let last=0;for(let p=0;p<=1;p+=.01){const s=partnershipReveal(p,i);assert(s>=last&&s<=1);last=s;}}
console.log('PASS continuous, reversible logo-axis flight for 250 units and four aspect ratios; five-step progress boundaries/reverse; six connection reveals complete before the reading hold.');

const {PassagePlayback}=require('../src/lib/chapter-playback.ts');
const clip=new PassagePlayback();
let input={raw:3,delta:1/60,active:true,pass:false,direct:false,enabled:true},frame;
for(let n=0;n<100;n++)frame=clip.update(input);
assert.equal(frame.phase,'reading');assert.equal(frame.progress,3.18);
input={...input,raw:4.01,pass:true};
let previous=3.18;
for(let n=0;n<260;n++){
 frame=clip.update(input);assert(frame.progress>=previous,'autonomous passage must continue with unchanged scroll');previous=frame.progress;
}
assert.equal(frame.phase,'complete');assert.equal(frame.progress,4.08);assert.equal(frame.running,false);
input={...input,raw:3.4,pass:false};
frame=clip.update(input);
assert.equal(frame.phase,'reading');assert.equal(frame.progress,3.18);assert.equal(frame.running,false);
const direct=new PassagePlayback().update({...input,raw:4.3,pass:true,direct:true});
assert.equal(direct.progress,4.3);assert.equal(direct.running,false);
const still=new PassagePlayback();still.update({...input,pass:true});
let frozen=still.update({...input,pass:true,delta:0});
for(let n=0;n<50;n++)assert.equal(still.update({...input,pass:true,delta:0}).progress,frozen.progress);
assert.equal(still.update({...input,enabled:false}).owns,false);
for(const p of [3.53,3.73]){
 const speed=(evaluateNarrative(p+.0001).cameraZ-evaluateNarrative(p-.0001).cameraZ)/.0002;
 assert(speed < -1,'camera must not stop at old intermediate keyframes');
}
const focus=evaluateNarrative(3.18).logo;
const aliveA=ambientFlowPose(3.18,12,1.6,focus,0),aliveB=ambientFlowPose(3.18,12,1.6,focus,3);
assert(Math.hypot(aliveA.x-aliveB.x,aliveA.y-aliveB.y)>.1,'background hold stays alive at unchanged scroll');
console.log('PASS passage completes with scroll held still, settles directly on returning, respects pause/direct anchors; camera has no intermediate stops; ambient hold keeps moving.');
const slow=new PassagePlayback();
let slowFrame;
for(let n=0;n<20;n++)slowFrame=slow.update({raw:4.01,delta:.25,active:true,pass:true,direct:false,enabled:true});
assert.equal(slowFrame.phase,'complete','low frame rates must not stretch the finite clip');
console.log('PASS elapsed-time completion at four frames per second.');
const {passageBoundary,crossesPassage}=require('../src/lib/passage-scroll.ts');
const gateBounds={vision:4000,roots:5200,height:800};
assert.equal(passageBoundary(gateBounds),4976);
assert(crossesPassage(4500,9000,gateBounds),'a large forward input must hit the passage gate');
assert(crossesPassage(4950,5000,gateBounds));
assert(!crossesPassage(5100,4500,gateBounds),'upward movement must not start a forward lock');
assert(!crossesPassage(0,9000,gateBounds),'an explicit seek from outside Vision stays available');
const guarded=new PassagePlayback();guarded.startPassage(2.2);
let guardedFrame;
for(let n=0;n<10;n++)guardedFrame=guarded.update({raw:4.01,delta:.25,active:true,pass:true,direct:false,enabled:true});
assert.equal(guardedFrame.phase,'complete');guarded.finishPassage();
assert.equal(guarded.update({raw:4.25,delta:0,active:true,pass:true,direct:false,enabled:true}).progress,4.25);
console.log('PASS forward scroll-gate boundaries, large-input interception, reverse/explicit-seek exemption and finite guarded playback.');

// The particle silhouette meets the solid mark before its finite reading hold.
for(const [mobile,portrait] of [[false,false],[false,true],[true,true],[true,false]]){
  const hero=evaluateNarrative(0,mobile,portrait),scatter=evaluateNarrative(2.18,mobile,portrait),formed=evaluateNarrative(2.98,mobile,portrait),held=evaluateNarrative(3.18,mobile,portrait);
  assert.equal(hero.brainSpread,0);assert.equal(hero.brainMorph,0);assert.equal(scatter.brainSpread,1);
  assert.equal(formed.brainSpread,0);assert.equal(formed.brainMorph,1);assert.equal(formed.brain.yaw,-Math.PI*2);
  for(const axis of ['x','y','z','scale'])assert(Math.abs(formed.brain[axis]-formed.logo[axis])<1e-9,'particle and solid frames must meet without a jump');
  assert.equal(held.brain.opacity,0);assert.equal(held.logo.opacity,1,'reading hold must finish the solid handoff');
  for(let p=3.08;p<=3.18;p+=.001){const state=evaluateNarrative(p,mobile,portrait);assert(Math.abs(state.brain.opacity+state.logo.opacity-1)<1e-8,'particle/solid crossfade has no dark frame');}
}
console.log('PASS deployed brain dispersion and particle-to-solid alignment on four viewport modes; solid handoff finishes before reading hold.');
