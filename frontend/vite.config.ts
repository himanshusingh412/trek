import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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

/**
 * The live site must not show placeholder legal details. A production build fails while src/lib/business.ts has a
 * `[…]` value, unless ALLOW_PLACEHOLDER_BUSINESS_DETAILS=true is set deliberately (then it warns, loudly).
 */
function requireBusinessDetails(): Plugin {
  return {
    name: 'require-business-details',
    apply: 'build',
    configResolved(config) {
      if (config.mode !== 'production') return
      const source = readFileSync(resolve(config.root, 'src/lib/business.ts'), 'utf8')
      const placeholders = [...source.matchAll(/^\s*(\w+):\s*'([^']*\[[^\]]+\][^']*)'/gm)].map((m) => m[1])
      if (placeholders.length === 0) return
      const problem = `src/lib/business.ts still has placeholder values: ${placeholders.join(', ')}`
      if (process.env.ALLOW_PLACEHOLDER_BUSINESS_DETAILS === 'true') {
        config.logger.warn(`\nWARNING: ${problem}. This build is NOT ready for launch or Razorpay review.\n`)
        return
      }
      throw new Error(
        `${problem}. Fill them in (docs/LAUNCH-READINESS.md), or set ALLOW_PLACEHOLDER_BUSINESS_DETAILS=true to build anyway.`,
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // VITE_* vars live in the repo-root .env alongside the backend's; real environment variables win.
  const envDir = '..'
  return {
    plugins: [react(), tailwindcss(), preloadFirstHero(), requireApiBaseUrl(loadEnv(mode, envDir, 'VITE_')), requireBusinessDetails()],
    envDir,
  }
})
