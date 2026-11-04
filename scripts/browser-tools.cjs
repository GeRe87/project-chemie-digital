/* Shared launch configuration for local browser verification. No downloads. */
const fs = require('node:fs');
const path = require('node:path');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

async function launchBrowser(engine = process.env.PLAYWRIGHT_BROWSER || 'chromium') {
  const kind = engine === 'edge' ? 'chromium' : engine;
  if (!['chromium', 'firefox', 'webkit'].includes(kind)) throw Error(`Unsupported browser: ${engine}`);
  const options = { headless: true };
  if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) options.executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
  else if (process.env.PLAYWRIGHT_CHANNEL || engine === 'edge') options.channel = process.env.PLAYWRIGHT_CHANNEL || 'msedge';
  // Explicit host configuration only, useful for containerized Chromium. Never
  // disable web security by default: local R network restrictions remain tested.
  if (process.env.PLAYWRIGHT_LAUNCH_ARGS) {
    const args = JSON.parse(process.env.PLAYWRIGHT_LAUNCH_ARGS);
    if (!Array.isArray(args) || args.some(value => typeof value !== 'string')) throw Error('PLAYWRIGHT_LAUNCH_ARGS must be a JSON array of strings.');
    options.args = args;
  }
  return playwright[kind].launch(options);
}

function readCourseMetadata(directory) {
  const manifestPath = path.join(directory, 'course-runtime/manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return {
      manifest,
      sceneDocumentBindings: manifest.bindings,
      sceneDocuments: manifest.documents.map(record => ({ id: record.id, scenes: record.sceneIds.map(id => ({ id })) })),
    };
  }
  // Kept for optional QA of already built v1 artifacts.
  return JSON.parse(fs.readFileSync(path.join(directory, 'course-runtime.json'), 'utf8'));
}

module.exports = { launchBrowser, readCourseMetadata };
