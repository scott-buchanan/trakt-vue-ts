import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Notify, Quasar } from 'quasar'
import { createManager } from '@vue-youtube/core'

import './styles/main.css'
// import '@quasar/extras/material-icons-outlined/material-icons-outlined.css'
// import 'quasar/src/css/index.sass'
import 'quasar/dist/quasar.css'
import '@fontsource-variable/inter';

import App from './App.vue'
import router from '~/router/index'

const app = createApp(App)
const pinia = createPinia()

app.use(router)
app.use(pinia)
app.use(createManager())
app.use(Quasar, {
  plugins: { Notify },
})
app.mount('#app')
