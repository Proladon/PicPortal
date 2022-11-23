import { createRouter, createWebHashHistory, RouteRecord } from 'vue-router'
import Layout from '../layout/index.vue'
import viewerRoutes from './modules/viewer'
import hotkeys from 'hotkeys-js'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Layout,
    meta: { keepAlive: true },
    children: [
      {
        path: '/viewer',
        name: 'Editor',
        component: () => import('../views/Viewer/Viewer.vue'),
        children: [...viewerRoutes],
        meta: {
          hotKeyScope: 'viewer',
        },
      },
      {
        path: '/about',
        name: 'About',
        component: () => import('../views/About/About.vue'),
        meta: {
          hotKeyScope: 'all',
        },
      },
      {
        path: '/projects',
        name: 'Projects',
        component: () => import('../views/Projects/Projects.vue'),
        meta: {
          hotKeyScope: 'projects',
        },
      },
      {
        path: '/settings',
        name: 'Settings',
        component: () => import('../views/Settings/Settings.vue'),
        meta: {
          hotKeyScope: 'settings',
        },
      },
    ],
  },
]

const router = createRouter({
  routes,
  history: createWebHashHistory(),
})

router.afterEach((to, from) => {
  hotkeys.setScope(to.meta.hotKeyScope)
})

export default router
