import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router"
// import Home from "../views/Home.vue"
import Layout from "../layout/index.vue"

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Layout,
    children: [
      {
        path: '/',
        component: () => import('../views/Home.vue')
      },
      {
        path: '/about',
        component: () => import('../views/About.vue')
      },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
