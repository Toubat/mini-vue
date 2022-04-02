import typescript from '@rollup/plugin-typescript';
import pkg from './package.json';

export default {
  input: './src/index.ts',
  output: [
    // 1. cjs -> commonJS
    // 2. esm -> esModule
    {
      format: 'cjs',
      file: pkg.main,
    },
    {
      format: 'es',
      file: pkg.module,
    },
  ],
  plugins: [typescript()],
};
