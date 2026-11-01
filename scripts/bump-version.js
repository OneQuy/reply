const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const packagePath = path.join(root, 'package.json');
const appJsonPath = path.join(root, 'app.json');

function bumpVersion(version) {
  const current = Number.parseInt(String(version).replace(/\D/g, ''), 10) || 0;
  const next = current + 1;
  return `${Math.floor(next / 100)}.${Math.floor(next / 10) % 10}.${next % 10}`;
}

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const current = pkg.version ?? appJson.expo?.version ?? '0.0.0';
const next = bumpVersion(current);

pkg.version = next;
if (!appJson.expo) appJson.expo = {};
appJson.expo.version = next;

fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`);

console.log(`${current} => ${next}`);
