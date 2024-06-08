import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createManager } from '@vue-youtube/core'

import './styles/main.css'
import '@fontsource-variable/inter'

import App from './App.vue'
import router from '~/router/index'

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

app.use(router)
app.use(createManager())
app.use(pinia)

app.mount('#app')

export { pinia }
