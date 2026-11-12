import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// Bundle only the two React islands. The six static pages keep their own router,
// navigation and original scripts; this output never replaces dist/index.html.
export default defineConfig({
  plugins: [react()],
  define: {'process.env.NODE_ENV': JSON.stringify('production')},
  base: '/assets/remotion/',
  build: {
    target: 'es2022',
    outDir: 'dist/assets/remotion',
    emptyOutDir: true,
    lib: {
      entry: 'src/remotion-islands.tsx',
      formats: ['es'],
      fileName: () => 'islands.js',
      cssFileName: 'components',
    },
    minify: true,
  },
});
