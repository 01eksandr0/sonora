import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { installProviders } from './providers'
import './styles/main.css'

const app = createApp(App)

installProviders(app)
app.use(router)

app.mount('#app')
