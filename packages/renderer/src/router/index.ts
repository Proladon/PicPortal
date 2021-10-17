import { createRouter, createWebHashHistory } from 'vue-router'
import Layout from '../layout/index.vue'
import viewerRoutes from './modules/viewer'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Layout,
    meta: { keepAlive: true },
    children: [
      {
        path: '/editor',
        name: 'Editor',
        component: () => import('../views/Editor.vue'),
        children: [...viewerRoutes],
      },
      {
        path: '/about',
        name: 'About',
        component: () => import('../views/About.vue'),
      },
      {
        path: '/projects',
        name: 'Projects',
        component: () => import('../views/Projects.vue'),
      },
      {
        path: '/settings',
        name: 'Settings',
        component: () => import('../views/Settings.vue'),
      },
    ],
  },
]

export default createRouter({
  routes,
  history: createWebHashHistory(),
})
