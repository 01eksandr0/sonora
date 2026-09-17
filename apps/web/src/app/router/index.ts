import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { registerGuards } from './guards'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

registerGuards(router)
