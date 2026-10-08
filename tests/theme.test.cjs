const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const path = require('node:path');
const {createThemeRunner, MAC_READ} = require('../src/theme.cjs');
const {createController} = require('../src/plugin.cjs');

function fixture(platform, response = '1\n', error = null, stderr = '') {
  const calls = [];
  const run = createThemeRunner({platform, binDir: path.join('project with spaces', 'bin'), systemRoot: 'C:\\Windows', execute: (...args) => {
    calls.push(args.slice(0, 3));
    args[3](error, response, stderr);
  }});
  return {run, calls};
}
for (const platform of ['win32', 'darwin']) {
  for (const state of [0, 1]) {
    test(`${platform}: read and toggle return state ${state}`, async () => {
      const {run, calls} = fixture(platform, ` ${state}\r\n`);
      assert.equal(await run('Read'), state);
      assert.equal(await run('Toggle'), state);
      for (const [, , options] of calls) {
        assert.equal(options.timeout, 15000);
        assert.equal(options.windowsHide, true);
        assert.equal(options.shell, undefined);
      }
      if (platform === 'win32') {
        assert.equal(calls[0][0], 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe');
        assert.deepEqual(calls[0][1], ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join('project with spaces', 'bin', 'theme.ps1'), '-Mode', 'Read']);
        assert.equal(calls[1][1].at(-1), 'Toggle');
      } else {
        assert.equal(calls[0][0], '/usr/bin/osascript');
        assert.deepEqual(calls[0][1].slice(0, 3), ['-l', 'JavaScript', '-e']);
        assert.doesNotMatch(calls[0][1][3], /System Events|Application\(/);
        assert.deepEqual(calls[1][1].slice(0, 3), ['-l', 'AppleScript', '-e']);
        assert.match(calls[1][1][3], /set dark mode to requestedDark/);
        assert.match(calls[1][1][3], /if dark mode is not requestedDark then error/);
      }
    });
  }
  test(`${platform}: malformed responses fail rather than indicate success`, async () => {
    for (const value of ['', 'true', '2', '1\n0', 'error 1']) {
      await assert.rejects(fixture(platform, value).run('Read'), /Unexpected theme response/);
    }
  });
  test(`${platform}: execution failure and timeout propagate`, async () => {
    await assert.rejects(fixture(platform, '1', new Error('missing executable')).run('Toggle'), /missing executable/);
    const timeout = Object.assign(new Error('killed'), {killed: true});
    await assert.rejects(fixture(platform, '1', timeout).run('Toggle'), /timed out/);
  });
}
test('macOS denied Automation produces actionable failure, even with valid stdout', async () => {
  await assert.rejects(fixture('darwin', '1', new Error('exit 1'), 'Not authorized to send Apple events. (-1743)').run('Toggle'), /Automation.*denied/);
});
test('unsupported OS and invalid mode do not execute commands', async () => {
  const unsupported = fixture('linux');
  await assert.rejects(unsupported.run('Read'), /Unsupported operating system/);
  assert.equal(unsupported.calls.length, 0);
  const supported = fixture('darwin');
  await assert.rejects(supported.run('Delete'), /Invalid theme operation/);
  assert.equal(supported.calls.length, 0);
});
test('macOS read script maps native preferences without writing (mock Objective-C bridge)', () => {
  for (const [style, expected] of [['Dark', 0], ['Light', 1], [undefined, 1], [null, 1], ['', 1]]) {
    const context = {ObjC: {import: x => assert.equal(x, 'Foundation'), unwrap: x => x},
      $: {NSUserDefaults: {standardUserDefaults: {stringForKey: key => {
        assert.equal(key, 'AppleInterfaceStyle'); return style;
      }}}}};
    assert.equal(vm.runInNewContext(MAC_READ, context), expected);
  }
  assert.throws(() => vm.runInNewContext(MAC_READ, {ObjC:{import(){}, unwrap:x=>x}, $:{NSUserDefaults:{standardUserDefaults:{stringForKey:()=> 'unexpected'}}}}), /Unexpected macOS/);
});
test('failed toggle alerts without changing icon; subsequent press recovers', async () => {
  const sent = []; let fail = false; let state = 1;
  const controller = createController(m => sent.push(m), async mode => {
    if (fail) throw Error('simulated denial');
    if (mode === 'Toggle') state = 1 - state;
    return state;
  });
  await controller.onMessage({event:'willAppear', context:'a'});
  fail = true; sent.length = 0;
  await controller.onMessage({event:'keyDown', context:'a'});
  assert.deepEqual(sent, [{event:'showAlert', context:'a'}]);
  fail = false;
  await controller.onMessage({event:'keyDown', context:'a'});
  assert.equal(sent.at(-1).payload.state, 0);
});
test('poll skips absent contexts and rejects invalid state without updating icons', async () => {
  let calls = 0; const sent = [];
  const controller = createController(m => sent.push(m), async () => { calls++; return 2; });
  await controller.refresh(); assert.equal(calls, 0);
  await controller.onMessage({event:'willAppear', context:'a'});
  assert.deepEqual(sent, [{event:'showAlert', context:'a'}]);
});
test('manifest keeps Windows UUIDs and adds macOS with manual icon states', () => {
  const manifest = require('../com.badbadrobot.windowstheme.sdPlugin/manifest.json');
  assert.equal(manifest.UUID, 'com.badbadrobot.windowstheme');
  assert.equal(manifest.Actions[0].UUID, 'com.badbadrobot.windowstheme.toggle');
  assert.equal(manifest.Actions[0].DisableAutomaticStates, true);
  assert.deepEqual(manifest.OS, [{Platform:'windows',MinimumVersion:'10'}, {Platform:'mac',MinimumVersion:'10.15'}]);
});
