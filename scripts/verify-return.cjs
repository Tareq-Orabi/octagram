const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, path) => module._compile(ts.transpileModule(fs.readFileSync(path, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText, path);
const { PassagePlayback } = require('../src/lib/chapter-playback.ts');
const { createPassageScrollGate } = require('../src/lib/passage-scroll.ts');

const playback = new PassagePlayback();
playback.finishPassage();
const vision = { raw: 3.4, delta: 0, active: true, pass: false, direct: true, enabled: true };
assert.deepEqual(playback.update(vision), { progress: 3.18, owns: true, running: false, phase: 'reading' });
assert.equal(playback.update({ ...vision, raw: 2.2, active: false }).owns, false);
assert.equal(playback.update({ ...vision, raw: 4.04, pass: true }).phase, 'complete');

const listeners = {}, timers = new Map(), classes = new Set();
let y = 5200, now = 0, timer = 0, started = 0;
const style = { overflow: 'auto', overscrollBehavior: 'contain', scrollBehavior: 'smooth' };
const root = { style, dataset: {}, classList: { add: name => classes.add(name), remove: name => classes.delete(name) } };
class Target { closest() { return null; } }
global.Element = Target;
global.document = { documentElement: root, addEventListener: (type, fn) => listeners['document:' + type] = fn };
global.location = { hash: '' };
global.innerHeight = 800;
global.performance = { now: () => now };
global.matchMedia = () => ({ matches: false });
Object.defineProperty(global, 'scrollY', { configurable: true, get: () => y });
global.window = {
  addEventListener: (type, fn) => listeners[type] = fn,
  scrollTo: ({ top }) => { y = top; },
  setTimeout: fn => { timers.set(++timer, fn); return timer; },
};
global.clearTimeout = id => timers.delete(id);
const bounds = { vision: 4000, roots: 5200, height: 800 };
const gate = createPassageScrollGate({ bounds: () => bounds, enabled: () => true,
  start: () => started++, skip: arrive => gate.release(arrive) });

function input(type, values) {
  let prevented = false;
  listeners[type]({ target: new Target(), preventDefault: () => prevented = true, ...values });
  return prevented;
}
const wheel = deltaY => input('wheel', { deltaY, deltaX: 0, deltaMode: 0, ctrlKey: false });

assert(!wheel(-600));
assert(!input('keydown', { key: 'PageUp' }));
listeners.touchstart({ touches: [{ clientY: 100 }] });
assert(!input('touchmove', { touches: [{ clientY: 700 }] }));
y = 4500; listeners.scroll();
assert(!gate.locked);
assert.equal(started, 0);
assert(wheel(800));
assert(gate.locked);
assert.equal(y, 4976);
assert.equal(style.overflow, 'hidden');
bounds.height = 700; gate.refresh();
assert.equal(y, 5004);
assert(input('keydown', { key: 'Escape' }));
assert(!gate.locked);
assert.equal(y, 5200);
assert(!wheel(-600));
assert.deepEqual(style, { overflow: 'auto', overscrollBehavior: 'contain', scrollBehavior: 'smooth' });

now = 1200; y = 4550; listeners.scroll();
assert(wheel(600), 'another forward pass works after returning to Vision');
assert(!wheel(-250), 'upward input can interrupt a forward clip immediately');
assert(!gate.locked);
assert.equal(y, 5004, 'an upward interruption never jumps to Roots');
gate.dispose();
assert(!gate.locked);
assert.equal(timers.size, 0);
assert(!classes.has('passage-locked'));
assert.equal(started, 2);
console.log('PASS forward-only logo playback, native reverse wheel/touch/keyboard scrolling, repeat entry, Escape and style restoration.');
