const sharp = require('sharp');
const path = require('node:path');

// Read-only geometry check for these blue-background 3D icons. The moon's
// silhouette is intentionally concave: measure its bounding box, not its mass.
function components(data, info, predicate) {
 const {width, height, channels} = info;
 const mask = new Uint8Array(width * height);
 for (let p = 0; p < mask.length; p++) {
  const i = p * channels;
  mask[p] = predicate(data[i], data[i + 1], data[i + 2]) ? 1 : 0;
 }
 const queue = new Int32Array(mask.length);
 const result = [];
 for (let p = 0; p < mask.length; p++) {
  if (!mask[p]) continue;
  let head = 0, tail = 1;
  queue[0] = p;
  mask[p] = 0;
  const box = {area:0, left:width, top:height, right:0, bottom:0};
  while (head < tail) {
   const q = queue[head++], x = q % width, y = Math.floor(q / width);
   box.area++;
   box.left = Math.min(box.left, x); box.right = Math.max(box.right, x);
   box.top = Math.min(box.top, y); box.bottom = Math.max(box.bottom, y);
   const neighbors = [x > 0 ? q - 1 : -1, x + 1 < width ? q + 1 : -1,
    y > 0 ? q - width : -1, y + 1 < height ? q + width : -1];
   for (const n of neighbors) if (n >= 0 && mask[n]) {
    mask[n] = 0; queue[tail++] = n;
   }
  }
  result.push(box);
 }
 return result.sort((a, b) => b.area - a.area);
}

async function check(name, file) {
 const {data, info} = await sharp(file).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const thresholds = name === 'sun' ? [40, 60, 80] : [90, 110, 130];
 const checks = [];
 for (const threshold of thresholds) {
  // Sun: warm saturated pixels exclude white clouds and pale blue/warm halos.
  // Moon: red/green brightness captures ceramic, then largest-component
  // selection excludes every separated star and the surrounding blue glow.
  const predicate = name === 'sun'
   ? (r, g, b) => r > 175 && g > 85 && r - b > threshold && g - b > threshold / 2
   : (r, g, b) => r > threshold && g > threshold && b - Math.min(r, g) < 100;
  const all = components(data, info, predicate);
  if (!all.length) throw new Error('No foreground found for ' + file);
  const subjects = name === 'sun' ? all.filter(c => c.area > all[0].area * .015) : [all[0]];
  const bounds = {
   left:Math.min(...subjects.map(c => c.left)), right:Math.max(...subjects.map(c => c.right)),
   top:Math.min(...subjects.map(c => c.top)), bottom:Math.max(...subjects.map(c => c.bottom))
  };
  const center = {x:(bounds.left + bounds.right) / 2, y:(bounds.top + bounds.bottom) / 2};
  const target = {x:(info.width - 1) / 2, y:(info.height - 1) / 2};
  checks.push({threshold, components:subjects.length, bounds, center,
   offsetPixels:{x:center.x - target.x, y:center.y - target.y},
   offsetPercent:{x:100 * (center.x - target.x) / info.width, y:100 * (center.y - target.y) / info.height}});
 }
 console.log(JSON.stringify({name, file, canvas:{width:info.width, height:info.height},
  targetCenter:{x:(info.width - 1) / 2, y:(info.height - 1) / 2}, checks}, null, 2));
}

(async () => {
 for (const name of ['sun', 'moon']) {
  const file = process.argv.includes('--exports')
   ? path.join(__dirname, '..', 'com.badbadrobot.windowstheme.sdPlugin', 'images', name + '-3d@2x.png')
   : path.join(__dirname, '..', 'assets', 'icons-3d', name + (process.argv.includes('--centered') ? '-centered' : '') + '.png');
  await check(name, file);
 }
})().catch(error => {console.error(error); process.exitCode = 1;});
