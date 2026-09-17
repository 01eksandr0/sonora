import type { App } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import { queryClient } from '@/shared/api/query-client'
import 'primeicons/primeicons.css'

export function installProviders(app: App) {
  app.use(createPinia())
  app.use(VueQueryPlugin, { queryClient })
  app.use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
        darkModeSelector: '.app-dark',
      },
    },
  })
}
