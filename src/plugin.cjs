const WebSocket = require('ws');
const { createThemeRunner } = require('./theme.cjs');

function createController(send, runTheme) {
  const contexts = new Set();
  let pending = 0;
  let queue = Promise.resolve();
  async function perform(toggle, context) {
    try {
      const state = await runTheme(toggle ? 'Toggle' : 'Read');
      if (state !== 0 && state !== 1) throw new Error('Invalid theme state');
      for (const id of contexts) send({event: 'setState', context: id, payload: {state}});
    } catch (error) {
      console.error('Theme operation failed:', error.message);
      for (const id of context ? [context] : contexts) send({event: 'showAlert', context: id});
    } finally { pending--; }
  }
  function refresh(toggle = false, context) {
    // Polls may be skipped; user presses must always run, even during a poll.
    if (!toggle && (pending > 0 || contexts.size === 0)) return Promise.resolve();
    pending++;
    queue = queue.then(() => perform(toggle, context));
    return queue;
  }
  async function onMessage(message) {
    if (message.event === 'willAppear') { contexts.add(message.context); await refresh(); }
    if (message.event === 'willDisappear') contexts.delete(message.context);
    if (message.event === 'keyDown') await refresh(true, message.context);
  }
  return { onMessage, refresh };
}

function main() {
  const args = process.argv.slice(2);
  const arg = name => args[args.indexOf(name) + 1];
  if (!args.includes('-port') || !args.includes('-pluginUUID') || !args.includes('-registerEvent')) throw new Error('Launch this plugin through Stream Deck.');
  const port = Number(arg('-port'));
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
  const ws = new WebSocket(`ws://127.0.0.1:${port}`);
  const send = value => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(value)); };
  const runTheme = createThemeRunner({binDir: __dirname});
  const controller = createController(send, runTheme);
  ws.on('open', () => send({event: arg('-registerEvent'), uuid: arg('-pluginUUID')}));
  ws.on('message', data => {
    try { void controller.onMessage(JSON.parse(data.toString())); }
    catch (error) { console.error(error.message); }
  });
  const timer = setInterval(() => void controller.refresh(), 5000);
  ws.on('close', () => { clearInterval(timer); process.exit(0); });
  ws.on('error', error => console.error(error.message));
}
module.exports = {createController};
if (require.main === module) main();
