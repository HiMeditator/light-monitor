import {createRouter, createWebHistory} from 'vue-router'

import SystemInfo from '@renderer/views/SystemInfo.vue'
import DataMonitor from '@renderer/views/DataMonitor.vue'

const router = createRouter({
  history:createWebHistory(),
  routes:[
    {
      path: '/',
      component: SystemInfo
    },
    {
      path: '/monitor',
      component: DataMonitor
    }
  ]
})

export default router
