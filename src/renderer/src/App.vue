<template>
  <div style="position: relative;">
    <a-menu
      id="nav-bar"
      v-model:selectedKeys="current"
      mode="horizontal"
      :items="items"
      @click="console.log(current)"
    >
    </a-menu>
    <div style="height: 45px;"></div>
    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
  import {RouterView, RouterLink} from 'vue-router'
  import { h, ref } from 'vue';
  import { DesktopOutlined, AppstoreAddOutlined } from '@ant-design/icons-vue';
  import { MenuProps } from 'ant-design-vue';
  const current = ref<string[]>(['hardware-info']);
  const items = ref<MenuProps['items']>([
    {
      key: 'hardware-info',
      icon: () => h(DesktopOutlined),
      label: h(RouterLink, { to: '/' }, () => '硬件信息')
    },
    {
      key: 'software-info',
      icon: () => h(AppstoreAddOutlined),
      label: h(RouterLink, { to: '/software-info' }, () => '软件信息')
    }
  ]);
</script>

<style scoped>
#nav-bar {
  position: absolute;
}
</style>  