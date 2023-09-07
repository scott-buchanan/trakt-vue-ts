/// <reference types="vitest" />

import path from 'path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Unocss from 'unocss/vite'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'

export default defineConfig({
  css: {
    devSourcemap: true, // this one
  },
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
    },
  },
  plugins: [
    Vue({
      reactivityTransform: true,
      template: { transformAssetUrls },
    }),

    // https://github.com/hannoeru/vite-plugin-pages
    // Pages(),
    // Pages({
    //   dirs: [
    //     { dir: 'src/pages', baseRoute: '' },
    //     { dir: 'src/pages/tv/show/season', baseRoute: 'tv/show/:show/season' },
    //     { dir: 'src/pages/tv/show/season/episode', baseRoute: 'tv/show/:show/season/:season/episode' },
    //   ],
    // }),

    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: [
        'vue',
        'vue/macros',
        'vue-router',
        '@vueuse/core',
      ],
      dts: true,
      // dirs: [
      //   './src/composables',
      // ],
      vueTemplate: true,
    }),

    // https://github.com/antfu/vite-plugin-components
    Components({
      dts: true,
    }),

    // https://github.com/antfu/unocss
    // see unocss.config.ts for config
    Unocss(),

    quasar({
      sassVariables: 'src/quasar-variables.scss',
    }),
  ],

  // https://github.com/vitest-dev/vitest
  test: {
    environment: 'jsdom',
  },
})
