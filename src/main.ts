import { createApp } from 'vue'

// import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'

import { Notify, Quasar } from 'quasar'
import quasarIconSet from 'quasar/icon-set/material-icons-outlined'

import { createManager } from '@vue-youtube/core'

import '@quasar/extras/material-icons-outlined/material-icons-outlined.css'
import 'quasar/src/css/index.sass'

import '@unocss/reset/tailwind.css'
import './styles/main.css'
import 'uno.css'

import App from './App.vue'

import router from '~/router/index'

const app = createApp(App)
const pinia = createPinia()
// const router = createRouter({
//   history: createWebHistory(import.meta.env.BASE_URL),
//   routes,
// })

app.use(router)
app.use(pinia)
app.use(createManager())
app.use(Quasar, {
  plugins: { Notify },
  iconSet: quasarIconSet,
})
app.mount('#app')
