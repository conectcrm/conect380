const fs = require('node:fs');
const path = require('node:path');

const candidates = ['dist/main.js', 'dist/src/main.js'];
const entrypoint = candidates.find((relativePath) =>
  fs.existsSync(path.resolve(process.cwd(), relativePath)),
);

if (!entrypoint) {
  console.error(
    '[start:prod] Build artifact not found. Run "npm run build" before "npm run start:prod".',
  );
  process.exit(1);
}

require(path.resolve(process.cwd(), entrypoint));
