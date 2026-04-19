import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type HtmlTagDescriptor, type Plugin } from 'vite'

/**
 * Adds a strict Content Security Policy to production builds: the page may only load
 * its own files and talk to its own origin + the API. This limits the damage of any
 * XSS bug, which matters because the session token is kept in localStorage.
 * Dev is left alone, since Vite's hot reload relies on inline scripts.
 */
function contentSecurityPolicy(apiUrl: string): Plugin {
  const policy = [
    "default-src 'self'",
    `connect-src 'self' ${apiUrl}`.trim(),
    "img-src 'self'",
    "style-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head' },
    ],
  }
}

/**
 * Faster first paint (production builds):
 * - preloads the font, so the browser fetches it with the HTML instead of after the CSS
 * - opens the connection to the API early when it's on another domain
 */
function preloadCriticalAssets(apiUrl: string): Plugin {
  return {
    name: 'preload-critical-assets',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, { bundle }) {
        const tags: HtmlTagDescriptor[] = []
        const font = Object.keys(bundle ?? {}).find((file) => file.endsWith('.woff2'))
        if (font) {
          tags.push({
            tag: 'link',
            attrs: { rel: 'preload', href: `/${font}`, as: 'font', type: 'font/woff2', crossorigin: '' },
            injectTo: 'head-prepend',
          })
        }
        if (apiUrl) {
          tags.push({
            tag: 'link',
            attrs: { rel: 'preconnect', href: apiUrl, crossorigin: '' },
            injectTo: 'head',
          })
        }
        return tags
      },
    },
  }
}

/**
 * Search engines and link previews (production builds):
 * - robots.txt: only the public sign-in page may be indexed; everything else is private
 * - with VITE_SITE_URL set: canonical link, absolute og/twitter image + url, and sitemap.xml
 */
function seo(siteUrl: string): Plugin {
  return {
    name: 'seo',
    apply: 'build',
    transformIndexHtml() {
      if (!siteUrl) return []
      const image = `${siteUrl}/og-image.png`
      const meta = (attrs: Record<string, string>): HtmlTagDescriptor => ({
        tag: 'meta',
        attrs,
        injectTo: 'head',
      })
      return [
        { tag: 'link', attrs: { rel: 'canonical', href: `${siteUrl}/` }, injectTo: 'head' },
        meta({ property: 'og:url', content: `${siteUrl}/` }),
        meta({ property: 'og:image', content: image }),
        meta({ property: 'og:image:width', content: '1200' }),
        meta({ property: 'og:image:height', content: '630' }),
        meta({ property: 'og:image:alt', content: 'Seenly: see when the emails you send get opened' }),
        meta({ name: 'twitter:image', content: image }),
      ]
    },
    generateBundle() {
      const robots = [
        'User-agent: *',
        'Allow: /$',
        'Disallow: /',
        ...(siteUrl ? ['', `Sitemap: ${siteUrl}/sitemap.xml`] : []),
      ]
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `${robots.join('\n')}\n` })

      if (siteUrl) {
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${siteUrl}/</loc></url>
</urlset>
`
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const withoutTrailingSlash = (url = '') => url.replace(/\/+$/, '')
  const apiUrl = withoutTrailingSlash(env.VITE_API_URL)
  const siteUrl = withoutTrailingSlash(env.VITE_SITE_URL)

  return {
    plugins: [
      react(),
      tailwindcss(),
      contentSecurityPolicy(apiUrl),
      preloadCriticalAssets(apiUrl),
      seo(siteUrl),
    ],
    server: {
      // In dev, /api calls go to the local service, so the app and API share one origin
      proxy: { '/api': 'http://localhost:4000' },
    },
  }
})
