const viewerRoutes = [
  {
    path: '/editor/viewer',
    name: 'Viewer',
    component: () => import('../../components/Viewer/ViewerWrapper.vue'),
    meta: { keepAlive: true },
    children: [
      {
        path: '/editor/viewer/virtual-list',
        name: 'VirtualList',
        component: () => import('/@/components/Viewer/VirtualList.vue'),
      },
      {
        path: '/editor/viewer/virtual-grid',
        name: 'VirtualGrid',
        component: () => import('/@/components/Viewer/VirtualGrid.vue'),
      },
      {
        path: '/editor/viewer/grid-view',
        name: 'GridView',
        component: () => import('/@/components/Viewer/GridView.vue'),
      },
      {
        path: '/editor/viewer/focus-view',
        name: 'FocusView',
        component: () => import('/@/components/Viewer/FocusView.vue'),
      },
    ],
  },
]

export default viewerRoutes
