import {createRouter, createWebHistory} from 'vue-router'

import HardwareInfo from '@renderer/views/SystemInfo.vue'
import SoftwareInfo from '@renderer/views/SoftwareInfo.vue'

const router = createRouter({
  history:createWebHistory(),
  routes:[
    {
      path: '/',
      component: HardwareInfo
    },
    {
      path: '/software-info',
      component: SoftwareInfo
    }
  ]
})

export default router
