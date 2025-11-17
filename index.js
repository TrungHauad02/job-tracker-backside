// Root shim for hosting platforms that run `node index.js`
// This file forwards to the compiled ESM entry in ./dist
import('./dist/index.js').catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
