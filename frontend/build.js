import * as esbuild from 'esbuild';
import { argv } from 'process';

const isWatch = argv.includes('--watch');

esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'public/main.js',
  format: 'esm',
  target: 'es2022',
  watch: isWatch,
  sourcemap: true,
});