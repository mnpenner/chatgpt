import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from "vite-plugin-svgr";
import basicSsl from '@vitejs/plugin-basic-ssl'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr(), basicSsl()],
  base: '/chatgpt/',
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    }
  },
  server: {
    // https://github.com/vitejs/vite/issues/11468#issuecomment-1407476069
    host: '0.0.0.0'
    // host: '127.0.0.1'
  }
})
