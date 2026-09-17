import type { RouteRecordRaw } from 'vue-router'

export const ROUTE_NAMES = {
  landing: 'landing',
  login: 'login',
  register: 'register',
  forgotPassword: 'forgot-password',
  app: 'app',
  home: 'home',
  onboarding: 'onboarding',
  search: 'search',
  artist: 'artist',
  album: 'album',
  playlist: 'playlist',
  library: 'library',
  settings: 'settings',
} as const

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/app/layouts/PublicLayout.vue'),
    children: [
      { path: '', name: ROUTE_NAMES.landing, component: () => import('@/pages/landing') },
      { path: 'login', name: ROUTE_NAMES.login, component: () => import('@/pages/login') },
      { path: 'register', name: ROUTE_NAMES.register, component: () => import('@/pages/register') },
      {
        path: 'forgot-password',
        name: ROUTE_NAMES.forgotPassword,
        component: () => import('@/pages/forgot-password'),
      },
    ],
  },
  {
    path: '/app',
    component: () => import('@/app/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: ROUTE_NAMES.home, component: () => import('@/pages/app/home') },
      {
        path: 'onboarding',
        name: ROUTE_NAMES.onboarding,
        component: () => import('@/pages/app/onboarding'),
        meta: { skipOnboardingCheck: true },
      },
      { path: 'search', name: ROUTE_NAMES.search, component: () => import('@/pages/app/search') },
      {
        path: 'artist/:id',
        name: ROUTE_NAMES.artist,
        component: () => import('@/pages/app/artist'),
      },
      { path: 'album/:id', name: ROUTE_NAMES.album, component: () => import('@/pages/app/album') },
      {
        path: 'playlist/:id',
        name: ROUTE_NAMES.playlist,
        component: () => import('@/pages/app/playlist'),
      },
      {
        path: 'library',
        name: ROUTE_NAMES.library,
        component: () => import('@/pages/app/library'),
      },
      {
        path: 'settings',
        name: ROUTE_NAMES.settings,
        component: () => import('@/pages/app/settings'),
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: { name: ROUTE_NAMES.landing } },
]
