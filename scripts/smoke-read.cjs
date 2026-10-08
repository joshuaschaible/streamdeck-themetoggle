// Read-only protocol smoke test. Never sends keyDown or changes OS appearance.
const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const path = require('node:path');
const {WebSocketServer} = require('ws');
const server = new WebSocketServer({host:'127.0.0.1', port:0});
let child, socket, completed = false;
const timer = setTimeout(() => finish(new Error('Plugin read timed out')), 25000);
function finish(error) {
  if (completed) return;
  completed = true;
  clearTimeout(timer);
  if (socket) socket.terminate();
  if (child) child.kill();
  server.close();
  if (error) { console.error(error); process.exitCode = 1; }
  else console.log(`PASS: bundled plugin registration and native ${process.platform} appearance read; no toggle sent.`);
}
server.on('error', finish);
server.on('listening', () => {
  child = spawn(process.execPath, [path.join(__dirname, '..', 'com.badbadrobot.windowstheme.sdPlugin', 'bin', 'plugin.js'), '-port', String(server.address().port), '-pluginUUID', 'read-only-smoke', '-registerEvent', 'registerPlugin'], {windowsHide:true, stdio:['ignore','pipe','pipe']});
  child.stderr.on('data', data => process.stderr.write(data));
  child.on('error', finish);
  child.on('exit', code => { if (!completed) finish(new Error(`Plugin exited early: ${code}`)); });
});
server.on('connection', ws => {
  socket = ws;
  ws.on('message', raw => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.event === 'registerPlugin') {
        assert.equal(msg.uuid, 'read-only-smoke');
        ws.send(JSON.stringify({event:'willAppear', context:'read-only-key'}));
      } else {
        assert.equal(msg.event, 'setState');
        assert.equal(msg.context, 'read-only-key');
        assert.ok(msg.payload.state === 0 || msg.payload.state === 1);
        finish();
      }
    } catch (error) { finish(error); }
  });
});
