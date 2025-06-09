import { defineConfig } from 'vitepress'
import { createWriteStream } from 'fs'
import { resolve } from 'path'
import { SitemapStream } from 'sitemap'
import { glob } from 'glob'
import matter from 'gray-matter'
import { readFileSync } from 'fs'

interface PageData {
  url: string
  lastmod?: Date
  priority?: number
  changefreq?: string
}
// https://vitepress.dev/reference/site-config
export default defineConfig({
  buildEnd: async (config) => {
    const hostname = 'https://reactrmiddleware.com'
    const sitemap = new SitemapStream({ hostname })
    
    const pages = await glob('**/*.md', {
      cwd: config.srcDir,
      ignore: ['**/node_modules/**', '**/.*/**']
    })
    
    const sitemapPath = resolve(config.outDir, 'sitemap.xml')
    const writeStream = createWriteStream(sitemapPath)
    sitemap.pipe(writeStream)
    
    const pageData: PageData[] = []
    
    // Process each page
    for (const page of pages) {
      const fullPath = resolve(config.srcDir, page)
      const fileContent = readFileSync(fullPath, 'utf-8')
      const { data: frontmatter } = matter(fileContent)
      
      const url = page
        .replace(/\.md$/, '')
        .replace(/\/index$/, '/')
        .replace(/^index$/, '')
      
      // Skip pages marked as draft or private
      if (frontmatter.draft || frontmatter.private) {
        continue
      }
      
      pageData.push({
        url: url || '/',
        lastmod: frontmatter.lastmod ? new Date(frontmatter.lastmod) : new Date(),
        priority: frontmatter.priority || (url === '' ? 1.0 : 0.7),
        changefreq: frontmatter.changefreq || 'weekly'
      })
    }
    
    // Sort pages by priority (highest first)
    pageData.sort((a, b) => (b.priority || 0) - (a.priority || 0))
    
    // Add pages to sitemap
    pageData.forEach(page => {
      sitemap.write({
        url: page.url,
        lastmod: page.lastmod,
        changefreq: page.changefreq as any,
        priority: page.priority
      })
    })
    
    sitemap.end()
    
    return new Promise((resolve) => {
      writeStream.on('finish', resolve)
    })
  },
  title: "Reactr Middleware",
  description: "Middleware functionality for react router v7",
  base:"/",
  cleanUrls:true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Docs', items:[
        { text: 'v-1.0.2 - Latest', link: '/docs/v-1.0.2/getting-started' },
        { text: 'v-1.0.0 (Deprecated)', link: '/docs/v-1.0.0/getting-started' },
      ] }
    ],

    sidebar: {
      '/docs/v-1.0.0/': [
        {
          text:"Getting Started",
          items:[
            { text: 'Quick Start', link: '/docs/v-1.0.0/getting-started' },
            { text: 'Why Reactr Middleware?', link: '/docs/v-1.0.0/why-reactr-middleware' },
          ]
        },
        {
          text:"Core Concepts",
          items:[
            { text: 'Middleware', link: '/docs/v-1.0.0/middleware' },
            { text: 'Registry', link: '/docs/v-1.0.0/registry' },
          ]
        }
      ],
      '/docs/v-1.0.2/': [
        {
          text:"Getting Started",
          items:[
            { text: 'Quick Start', link: '/docs/v-1.0.2/getting-started' },
          ]
        },
        {
          text:"Core Concepts",
          items:[
            { text: 'Middleware', link: '/docs/v-1.0.2/middleware' },
            { text: 'Registry', link: '/docs/v-1.0.2/registry' },
          ]
        }
      ]
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-Present Deta Labs'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/DeltaLabs-Community/reactr-middleware.git' }
    ]
  }
})
