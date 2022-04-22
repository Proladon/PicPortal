const viewerRoutes = [
  {
    path: '/editor/viewer',
    name: 'Viewer',
    component: () => import('/@/views/Viewer/components/ViewerWrapper.vue'),
    meta: { keepAlive: true },
    children: [
      {
        path: '/editor/viewer/virtual-list',
        name: 'VirtualList',
        component: () =>
          import(
            '/@/views/Viewer/components/VirtualListView/VirtualListView.vue'
          )
      },
      {
        path: '/editor/viewer/virtual-grid',
        name: 'VirtualGrid',
        component: () =>
          import(
            '/@/views/Viewer/components/VirtualGridView/VirtualGridView.vue'
          )
      },
      {
        path: '/editor/viewer/grid-view',
        name: 'GridView',
        component: () =>
          import('/@/views/Viewer/components/GridView/GridView.vue')
      },
      {
        path: '/editor/viewer/focus-view',
        name: 'FocusView',
        component: () =>
          import('/@/views/Viewer/components/FocusView/FocusView.vue')
      }
    ]
  }
]

export default viewerRoutes
