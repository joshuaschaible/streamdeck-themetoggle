const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');
const sharp = require('sharp');
const root = path.join(__dirname, 'com.badbadrobot.windowstheme.sdPlugin');
const iconMasters = path.join(__dirname, 'assets', 'icons-3d');
const exportFrames = JSON.parse(fs.readFileSync(path.join(iconMasters, 'export-frames.json')));
async function build() {
 for (const name of ['sun', 'moon']) {
  const source = path.join(iconMasters, name + '.png');
  if (!fs.existsSync(source)) throw new Error('Missing 3D icon master: ' + source);
 }
 await esbuild.build({absWorkingDir:__dirname, entryPoints:[path.join(__dirname, 'src/plugin.cjs')], bundle:true, platform:'node', target:'node20', outfile:root+'/bin/plugin.js', external:['bufferutil','utf-8-validate']});
 fs.mkdirSync(root+'/images',{recursive:true});
 const sun = '<circle cx="72" cy="72" r="22"/><path d="M72 24v12m0 72v12M24 72h12m72 0h12M38 38l9 9m50 50l9 9M38 106l9-9m50-50l9-9"/>';
 // Keep the original line artwork for the plugin, action and category icons.
 // The previous light.png and dark.png key assets remain available unchanged.
 for (const [name, body, bg, fg, size] of [
  ['plugin',sun,'#151923','#ffd166',256], ['action',sun,'none','#ffffff',40]]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 144 144"><rect width="144" height="144" rx="18" fill="${bg}"/><g fill="none" stroke="${fg}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(root,'images',name+'.png'));
  await sharp(Buffer.from(svg)).resize(size*2,size*2).png().toFile(path.join(root,'images',name+'@2x.png'));
 }
 for (const name of ['sun', 'moon']) {
  const source = path.join(iconMasters, name + '.png');
  const frame = exportFrames[name];
  // Export square viewports centered on the measured solid subject bounds.
  // This keeps the generated artwork intact while ensuring precise key alignment.
  await sharp(source).extract(frame).png().toFile(path.join(iconMasters, name + '-centered.png'));
  for (const [suffix, size] of [['', 72], ['@2x', 144]]) {
   await sharp(source)
    .extract(frame)
    .resize(size, size, {fit:'cover', position:'centre', kernel:'lanczos3'})
    .png()
    .toFile(path.join(root, 'images', name + '-3d' + suffix + '.png'));
  }
 }
 const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json'));
 manifest.Category = manifest.Name;
 manifest.CategoryIcon = 'images/action';
 manifest.Actions[0].States.forEach(s=>{s.ShowTitle=false; delete s.Title;});
 // The key depicts the current mode: moon in dark mode, sun in light mode.
 manifest.Actions[0].States[0].Image = 'images/moon-3d';
 manifest.Actions[0].States[1].Image = 'images/sun-3d';
 fs.writeFileSync(root+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
}
build().catch(e=>{console.error(e);process.exitCode=1;});
