// Prepara la carpeta www/ para la app nativa: copia la web y añade el puente con el móvil.
import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';

const OUT = 'www';
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT);
for (const f of ['index.html', 'privacidad.html', 'manifest.webmanifest', 'manifest-discreto.webmanifest', 'sw.js', 'css', 'js', 'icons']) {
  await cp(f, `${OUT}/${f}`, { recursive: true });
}
await build({ entryPoints: ['native/bridge.js'], bundle: true, format: 'iife', minify: true, outfile: `${OUT}/js/native.bundle.js`, target: 'es2020' });
const html = await readFile(`${OUT}/index.html`, 'utf8');
await writeFile(`${OUT}/index.html`, html.replace('<script type="module" src="js/app.js"></script>', '<script src="js/native.bundle.js"></script>\n  <script type="module" src="js/app.js"></script>'));
console.log('www/ lista');
