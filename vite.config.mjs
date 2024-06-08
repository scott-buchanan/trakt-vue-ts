/// <reference types="vitest" />

import path from 'node:path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'

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
      template: {
        compilerOptions: {
          isCustomElement: tag => ['iconify-icon'].includes(tag),
        },
      },
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
      imports: ['vue', 'vue/macros', 'vue-router', '@vueuse/core'],
      dts: true,
      // dirs: [
      //   './src/composables',
      // ],
      vueTemplate: true,
      eslintrc: {
        enabled: true, // Default `false`
        filepath: './.eslintrc-auto-import.json', // Default `./.eslintrc-auto-import.json`
        globalsPropValue: true, // Default `true`, (true | false | 'readonly' | 'readable' | 'writable' | 'writeable')
      },
    }),

    // https://github.com/antfu/vite-plugin-components
    Components({
      dts: true,
    }),
  ],

  // https://github.com/vitest-dev/vitest
  test: {
    environment: 'jsdom',
  },
})
