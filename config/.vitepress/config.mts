import { defineConfig } from 'vitepress';
import { sidebar } from './sidebar.mts'; 

export default defineConfig({
  title: "Cure Dolly",
  description: "in markdown",
  srcDir: 'docs',
  base: process.env.VITE_BASE_URL || '/',
  ignoreDeadLinks: true,
  rewrites: {
    'en/:rest*': ':rest*'
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en',
    },
    vi: {
      label: 'Tiếng Việt',
      lang: 'vi',
    }
  },

  markdown: {
    image: {
      lazyLoading: true
    }
  },
  
  head: [
    [
      'link',
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' }
    ],
    [
      'link',
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }
    ],
    [
      'link',
      { href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap', rel: 'stylesheet' }
    ],
    ['meta', { name: 'og:title', content: "Cure Dolly Vietnamese - Hướng dẫn ngữ pháp tiếng Nhật" }],
    ['meta', { property: 'og:description', content: 'Bản dịch tiếng Việt của hướng dẫn ngữ pháp tiếng Nhật Cure Dolly' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://dovahkrid.github.io/cure-dolly-vietnamese' }],
    ['meta', { name: 'twitter:url', content: 'https://dovahkrid.github.io/cure-dolly-vietnamese' }],
    ['meta', { name: 'twitter:card', content: 'summary' } ],
    ['meta', { name: 'twitter:title', content: 'Cure Dolly Vietnamese' } ],
    ['meta', { name: 'twitter:description', content: 'Bản dịch tiếng Việt của hướng dẫn ngữ pháp tiếng Nhật Cure Dolly' } ],
  ],

  themeConfig: {
    sidebar: sidebar,
    editLink: {
      pattern: 'https://github.com/dovahkrid/cure-dolly-vietnamese/edit/main/config/docs/:path'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/dovahkrid/cure-dolly-vietnamese' }
    ],
    search: {
      provider: 'local'
    },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'About', link: '/about/about' }
    ],
    footer: {
      message: 'Vietnamese translation by <a href="https://github.com/dovahkrid">dovahkrid</a> with <a href="https://claude.ai">Claude</a>',
      copyright: 'Original site by <a href="https://bento.me/kln">Kellen</a> · Transcript by <a href="https://docs.google.com/document/d/1XpuXerkGU8waJ4DPDNJA4bGeqOvM-csXjTe57iHARHc">nunko/dinuz & Mordraug</a>'
    }
  }
});
