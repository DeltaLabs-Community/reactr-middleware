import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Reactr Middleware",
  description: "Middleware functionality for react router v7",
  base:"/",
  cleanUrls:true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Docs', items:[
        { text: 'v-1.0.0', link: '/docs/v-1.0.0/getting-started' },
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
      ]
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-Present Deta Labs'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
