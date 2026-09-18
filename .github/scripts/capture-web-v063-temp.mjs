import fs from 'node:fs/promises';
import process from 'node:process';

const port = 9222;
const baseUrl = process.env.CAPTURE_URL || 'http://127.0.0.1:4173/';
const outDir = process.env.CAPTURE_OUT || 'capture/web';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function json(url, init = {}) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error('HTTP ' + response.status + ' for ' + url);
  return response.json();
}

async function createTarget(url) {
  return json('http://127.0.0.1:' + port + '/json/new?' + encodeURIComponent(url), { method: 'PUT' });
}

class Cdp {
  constructor(wsUrl) {
    this.nextId = 1;
    this.pending = new Map();
    this.ws = new WebSocket(wsUrl);
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
      else pending.resolve(message.result);
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    const payload = { id, method, params };
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
    });
  }

  close() {
    this.ws.close();
  }
}

async function evaluate(cdp, expression, awaitPromise = false) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
    userGesture: true
  });
  if (result.exceptionDetails) {
    throw new Error('Runtime.evaluate failed: ' + JSON.stringify(result.exceptionDetails));
  }
  return result.result.value;
}

async function waitFor(cdp, expression, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(cdp, expression)) return;
    await sleep(150);
  }
  throw new Error('Timed out waiting for: ' + expression);
}

async function screenshot(cdp, name) {
  const result = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
    fromSurface: true
  });
  const path = outDir + '/' + name;
  await fs.writeFile(path, Buffer.from(result.data, 'base64'));
  console.log('captured ' + path);
}

async function canvasPoint(cdp, dx, dy) {
  return evaluate(cdp, "(() => { const r = document.querySelector('#board').getBoundingClientRect(); return {x:r.left+r.width/2+" + dx + ", y:r.top+r.height/2+" + dy + "}; })()");
}

async function clickPoint(cdp, point) {
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: point.x,
    y: point.y,
    button: 'left',
    clickCount: 1
  });
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: point.x,
    y: point.y,
    button: 'left',
    clickCount: 1
  });
}

await fs.mkdir(outDir, { recursive: true });

const target = await createTarget(baseUrl);
const cdp = new Cdp(target.webSocketDebuggerUrl);
await cdp.open();

try {
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1080,
    height: 1920,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: 1080,
    screenHeight: 1920
  });

  await waitFor(cdp, "document.readyState === 'complete' && !!document.querySelector('#board')");
  await waitFor(cdp, "document.styleSheets.length > 0 && getComputedStyle(document.querySelector('#app')).display === 'flex'", 15000);
  await waitFor(cdp, "!document.querySelector('#modeSelect').disabled", 30000);
  const cssState = await evaluate(cdp, "({sheets:document.styleSheets.length,appDisplay:getComputedStyle(document.querySelector('#app')).display,buttonRadius:getComputedStyle(document.querySelector('#settingsButton')).borderRadius})");
  if (cssState.sheets < 1 || cssState.appDisplay !== 'flex' || cssState.buttonRadius === '0px') {
    throw new Error('Production CSS is not applied: ' + JSON.stringify(cssState));
  }
  console.log('production CSS verified: ' + JSON.stringify(cssState));
  await sleep(800);

  await evaluate(cdp, "document.querySelector('#difficultySelect').value='expert'; document.querySelector('#difficultySelect').dispatchEvent(new Event('change',{bubbles:true})); true");
  const first = await canvasPoint(cdp, 0, 0);
  await clickPoint(cdp, first);
  await sleep(2600);
  await screenshot(cdp, '01-ai-gameplay.png');

  await evaluate(cdp, "document.querySelector('#settingsButton').click(); true");
  await waitFor(cdp, "document.querySelector('#settingsDialog').open === true");
  await sleep(300);
  await screenshot(cdp, '02-settings.png');
  await evaluate(cdp, "document.querySelector('#settingsCloseButton').click(); true");
  await waitFor(cdp, "document.querySelector('#settingsDialog').open === false");

  await evaluate(cdp, "document.querySelector('#modeSelect').value='local'; document.querySelector('#modeSelect').dispatchEvent(new Event('change',{bubbles:true})); true");
  await sleep(900);
  const local1 = await canvasPoint(cdp, -45, 0);
  const local2 = await canvasPoint(cdp, 45, 0);
  await clickPoint(cdp, local1);
  await sleep(250);
  await clickPoint(cdp, local2);
  await sleep(500);
  await screenshot(cdp, '03-local-play.png');

  await evaluate(cdp, "document.querySelector('#aboutButton').click(); true");
  await waitFor(cdp, "document.querySelector('#aboutDialog').open === true");
  await sleep(300);
  await screenshot(cdp, '04-about.png');

  const version = await evaluate(cdp, "document.querySelector('#aboutVersion').textContent");
  console.log('about version: ' + version);
} finally {
  cdp.close();
}
