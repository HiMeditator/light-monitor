import './assets/main.css'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';

import router from './router'
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.use(Antd)
app.use(router)
app.mount('#app')
