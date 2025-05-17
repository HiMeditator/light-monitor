import { createRouter, createWebHashHistory } from 'vue-router'
import SystemInfo from '../views/SystemInfo.vue'
import DataMonitor from '../views/DataMonitor.vue'
import ResourceMonitor from '../views/ResourceMonitor.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'hardware-info',
      component: SystemInfo
    },
    {
      path: '/process',
      name: 'software-info',
      component: DataMonitor
    },
    {
      path: '/resource',
      name: 'resource-monitor',
      component: ResourceMonitor
    }
  ]
})

export default router
