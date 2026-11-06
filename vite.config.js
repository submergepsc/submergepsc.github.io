import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { prepareContent } from './scripts/prepare-content.mjs'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'garden-content-refresh',
      configureServer(server) {
        let timer
        server.watcher.add(['content', 'src/tools/catalog.json'])
        const refresh = (path) => {
          if (
            !path.replaceAll('\\', '/').includes('/content/') &&
            !path.endsWith('/src/tools/catalog.json')
          )
            return
          clearTimeout(timer)
          timer = setTimeout(async () => {
            try {
              await prepareContent()
              server.ws.send({ type: 'full-reload' })
            } catch (error) {
              server.config.logger.error(error.message)
            }
          }, 150)
        }
        for (const event of ['add', 'change', 'unlink']) server.watcher.on(event, refresh)
        server.httpServer?.once('close', () => clearTimeout(timer))
      },
    },
  ],
  ssgOptions: {
    dirStyle: 'nested',
    formatting: 'minify',
    includedRoutes: (paths) => paths.filter((p) => !p.includes(':')),
  },
  server: { port: 5173, strictPort: true },
  preview: { port: 4174, strictPort: true },
})
