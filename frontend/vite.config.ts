import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const FIRST_HERO = 'src/assets/hero/hero-1.jpg'

/**
 * Starts the first landing photo downloading from index.html, alongside the app's script, instead of only
 * once React has rendered the hero. Only on the home page: other pages never show it. In a build the link
 * points at the photo's hashed file; in dev, at the source file.
 */
function preloadFirstHero(): Plugin {
  return {
    name: 'preload-first-hero',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        let href = `/${FIRST_HERO}`
        for (const out of Object.values(ctx.bundle ?? {})) {
          if (out.type === 'asset' && out.originalFileNames?.some((f) => f.endsWith(FIRST_HERO))) {
            href = `/${out.fileName}`
          }
        }
        return [
          {
            tag: 'script',
            injectTo: 'head-prepend',
            children: `if(location.pathname==='/'){var l=document.createElement('link');l.rel='preload';l.as='image';l.href=${JSON.stringify(href)};l.fetchPriority='high';document.head.appendChild(l)}`,
          },
        ]
      },
    },
  }
}

/**
 * A production build must say where the API is: VITE_API_BASE_URL is baked into the bundle, and a missing one
 * would point the live site at nothing. '' is allowed (site and API on one origin); plain http only for localhost.
 */
function requireApiBaseUrl(env: Record<string, string>): Plugin {
  return {
    name: 'require-api-base-url',
    apply: 'build',
    configResolved(config) {
      if (config.mode !== 'production') return
      const url = env.VITE_API_BASE_URL
      if (url === undefined) {
        throw new Error('VITE_API_BASE_URL is not set. Set it in .env or the environment (see docs/ENVIRONMENT.md).')
      }
      if (url !== '' && !/^https:\/\//.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(url)) {
        throw new Error(`VITE_API_BASE_URL must be https:// (or http://localhost for a local build), got "${url}"`)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // VITE_* vars live in the repo-root .env alongside the backend's; real environment variables win.
  const envDir = '..'
  return {
    plugins: [react(), tailwindcss(), preloadFirstHero(), requireApiBaseUrl(loadEnv(mode, envDir, 'VITE_'))],
    envDir,
  }
})
