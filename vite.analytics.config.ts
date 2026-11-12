import {defineConfig} from 'vite';
export default defineConfig({define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{target:'es2022',outDir:'dist/assets/analytics',emptyOutDir:true,lib:{entry:'src/services/analytics.ts',formats:['es'],fileName:()=> 'analytics.js'},minify:true}});
