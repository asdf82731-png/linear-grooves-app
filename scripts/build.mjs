// Builds every app that has a src/ folder (or only the ones named: npm run build -- double-pedal).
import {existsSync, rmSync} from 'node:fs';
import {execSync} from 'node:child_process';

const all = ['linear-grooves', 'double-pedal', 'djent', 'timekeeper'].filter(a => existsSync(`${a}/src`));
const apps = process.argv.slice(2).length ? process.argv.slice(2) : all;
for (const app of apps) {
  rmSync(`${app}/assets`, {recursive: true, force: true});
  console.log(`\n▶ ${app}`);
  execSync('npx vite build', {stdio: 'inherit', env: {...process.env, APP: app}});
}
