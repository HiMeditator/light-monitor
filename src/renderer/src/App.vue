<template>
  <div style="position: relative;">
    <a-menu
      style="z-index: 100;"
      id="nav-bar"
      v-model:selectedKeys="current"
      mode="horizontal"
      :items="items"
    >
    </a-menu>
    <div style="height: 60px;"></div>
    <router-view></router-view>
    <div style="height: 20px;"></div>
  </div>
</template>

<script setup lang="ts">
  import {RouterView, RouterLink} from 'vue-router'
  import { h, ref } from 'vue';
  import { DesktopOutlined, AppstoreAddOutlined, LineChartOutlined } from '@ant-design/icons-vue';
  import { MenuProps } from 'ant-design-vue';
  const current = ref<string[]>(['hardware-info']);
  const items = ref<MenuProps['items']>([
    {
      key: 'hardware-info',
      icon: () => h(DesktopOutlined),
      label: h(RouterLink, { to: '/' }, () => '系统信息')
    },
    {
      key: 'software-info',
      icon: () => h(AppstoreAddOutlined),
      label: h(RouterLink, { to: '/process' }, () => '进程监控')
    },
    {
      key: 'resource-monitor',
      icon: () => h(LineChartOutlined),
      label: h(RouterLink, { to: '/resource' }, () => '资源监控')
    }
  ]);
</script>

<style scoped>
#nav-bar {
  position: fixed;
  width: 100%;
}
</style>  