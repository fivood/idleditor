// Bake server: `npm run art:bake`, then open the printed URL and press “全部烘焙”.
// Renders the 3D props with three.js (dev dependency only) and writes pixel sprites into src/art/baked/.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(here, '../..')
const three = path.join(repo, 'node_modules/three').replaceAll('\\', '/')
// The typewriter model lives in the sibling kinotype project; the bake skips it when that folder is absent.
const kinotype = process.env.KINOTYPE ?? 'G:/movie-scripts/kinotype/src/three'
const writable = [path.join(repo, 'src/art/baked'), path.join(repo, '.dream-loop/bake')]

const server = await createServer({
  configFile: false, root: here, logLevel: 'info',
  resolve: { alias: [
    { find: /^three$/, replacement: `${three}/build/three.module.js` },
    { find: /^three\/addons\/(.*)$/, replacement: `${three}/examples/jsm/$1` },
    { find: /^@kinotype\/(.*)$/, replacement: `${kinotype}/$1` },
  ] },
  define: { __KINOTYPE__: JSON.stringify(fs.existsSync(kinotype)) },
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { port: 5299, fs: { allow: [here, three, kinotype] } },
  plugins: [{
    name: 'bake-save',
    configureServer(dev) {
      // POST /save?path=src/art/baked/x.ts (text) or .dream-loop/bake/x.png (data URL); nothing else is writable.
      dev.middlewares.use('/save', (req, res) => {
        const target = path.resolve(repo, new URL(req.url, 'http://x').searchParams.get('path') ?? '')
        if (!writable.some(dir => target.startsWith(dir + path.sep))) { res.statusCode = 403; res.end('refused'); return }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          fs.mkdirSync(path.dirname(target), { recursive: true })
          fs.writeFileSync(target, target.endsWith('.png') ? Buffer.from(body.split(',')[1], 'base64') : body)
          res.end('ok')
        })
      })
    },
  }],
})
await server.listen()
server.printUrls()
