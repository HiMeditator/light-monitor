<template>
<div class="container">
  <div class="system-info">

    <div class="info-item">
      <div class="item-title">
        <FontAwesomeIcon :icon="faComputer" /> 设备信息
      </div>
      <div><b>生产商：</b>{{ sysInfo.manufacturer }}</div>
      <div><b>设备型号：</b>{{ sysInfo.model }}</div>
      <div><b>设备版本：</b>{{ sysInfo.version }}</div>
      <div><b>设备序列号：</b><span class="blur-info">{{ sysInfo.serial }}</span></div>
      <div><b>是否虚拟机：</b>{{ sysInfo.virtual? "是" : "否" }}</div>
    </div>

    <div class="info-item">
      <div class="item-title">
        <FontAwesomeIcon :icon="faLayerGroup" /> 操作系统信息
      </div>
      <div><b>平台：</b>{{ osInfo.platform }}</div>
      <div><b>发行版：</b>{{ osInfo.distro }}</div>
      <div><b>内核版本：</b>{{ osInfo.kernel }}</div>
      <div><b>系统架构：</b>{{ osInfo.arch }}</div>
      <div><b>主机名：</b>{{ osInfo.hostname }}</div>
      <div><b>序列号：</b><span class="blur-info">{{ osInfo.serial }}</span></div>
    </div>

    <div class="info-item">
      <div class="item-title">
        <FontAwesomeIcon :icon="faLayerGroup" /> 主板信息
      </div>
      <div><b>生产商：</b>{{ boardInfo.manufacturer }}</div>
      <div><b>型号：</b>{{ boardInfo.model }}</div>
      <div><b>版本：</b>{{ boardInfo.version }}</div>
      <div><b>最大内存：</b>{{ (boardInfo.memMax / 1024 / 1024 / 1024).toFixed(2) }} G</div>
      <div><b>内存插槽：</b>{{ boardInfo.memSlots }}</div>
    </div>

    <div class="info-item">
      <div class="item-title">
        <FontAwesomeIcon :icon="faMicrochip" /> CPU信息
      </div>
      <div><b>生产商：</b>{{ cpuInfo.manufacturer }}</div>
      <div><b>CPU型号：</b>{{ cpuInfo.brand }}</div>
      <div><b>最高时钟频率：</b>{{ cpuInfo.speed }} Ghz</div>
      <div><b>物理核心数：</b>{{ cpuInfo.physicalCores }}</div>
      <div><b>逻辑核心数：</b>{{ cpuInfo.cores }}</div>
      <div><b>虚拟化：</b>{{ cpuInfo.virtualization? "已开启" : "已关闭或不支持" }}</div>
      <div>
        <b>缓存大小</b>
        <ul>
          <li v-for="(val, key) in cpuInfo.cache" :key="key">
            <b>{{ key }}:</b> {{ val }} bytes
          </li>
        </ul>
      </div>
    </div>

    <div v-for="(mem, idx) in memsInfo" class="info-item">
      <div class="item-title"><FontAwesomeIcon :icon="faMemory" /> 内存{{ idx }}信息</div>
      <div><b>生产商：</b>{{ mem.manufacturer }}</div>
      <div><b>内存容量：</b>{{ (mem.size / 1024 / 1024 / 1024).toFixed(2) }} G</div>
      <div><b>内存类型：</b>{{ mem.type }}</div>
    </div>

    <div v-for="(disk, idx) in disksInfo" class="info-item">
      <div class="item-title"><FontAwesomeIcon :icon="faHardDrive" /> 磁盘{{idx+1}}信息</div>
      <div><b>生产商：</b>{{ disk.vendor }}</div>
      <div><b>磁盘类型：</b>{{ disk.type }} M</div>
      <div><b>磁盘名称：</b>{{ disk.name }} M</div>
      <div><b>设备路径：</b>{{ disk.device }} M</div>
      <div><b>磁盘容量：</b>{{ (disk.size / 1024 / 1024 / 1024).toFixed(2) }} G</div>
      <div><b>磁盘序列号：</b><span class="blur-info">{{ disk.serialNum }}</span></div>
      <div><b>磁盘SMART状态：</b>{{ disk.smartStatus }}</div>
      <div><b>磁盘SMART状态：</b>{{ disk.smartData || "未获取" }}</div>
    </div>

    <div v-for="idx in displayInfo.controllers?.length" class="info-item">
      <div class="item-title"><FontAwesomeIcon :icon="faDisplay" /> 显示器{{idx}}信息</div>
      <div><b>控制器型号：</b>{{ displayInfo.controllers[idx-1].model }}</div>
      <div><b>控制器总线类型：</b>{{ displayInfo.controllers[idx-1].bus }}</div>
      <div><b>显存大小：</b>{{ displayInfo.controllers[idx-1].vram }} MB</div>
      <div v-if="displayInfo.displays[idx-1]">
        <div><b>显示器制造商：</b>{{ displayInfo.displays[idx-1].vendor}}</div>
        <div><b>显示器型号：</b>{{ displayInfo.displays[idx-1].model }}</div>
        <div><b>分辨率：</b>{{ displayInfo.displays[idx-1].resolutionX }} x {{ displayInfo.displays[idx-1].resolutionY }}</div>
        <div><b>刷新率：</b>{{ displayInfo.displays[idx-1].currentRefreshRate }} Hz</div>
      </div>
    </div>

  </div>
</div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faComputer, faMemory, faHardDrive,
  faMicrochip, faDisplay, faLayerGroup
} from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'

const sysInfo = ref<any>({})
const boardInfo = ref<any>({})
const osInfo = ref<any>({})
const cpuInfo = ref<any>({})
const memsInfo = ref<any>([])
const disksInfo = ref<any[]>([])
const displayInfo = ref<any>([])

function getSysInfo() {
  sysInfo.value = {}
  window.electron.ipcRenderer.invoke('get.sysInfo').then((data: any) => {
    sysInfo.value = data
  })
}

function getBoardInfo() {
  boardInfo.value = {}
  window.electron.ipcRenderer.invoke('get.boardInfo').then((data: any) => {
    boardInfo.value = data
  })
}

function getOsInfo() {
  osInfo.value = {}
  window.electron.ipcRenderer.invoke('get.osInfo').then((data: any) => {
    osInfo.value = data
  })
}

function getCpuInfo() {
  cpuInfo.value = {}
  window.electron.ipcRenderer.invoke('get.cpuInfo').then((data: any) => {
    cpuInfo.value = data
  })
}

function getMemsInfo() {
  memsInfo.value = []
  window.electron.ipcRenderer.invoke('get.memsInfo').then((data: any) => {
    memsInfo.value = data
  })
}

function getDisksInfo() {
  disksInfo.value = []
  window.electron.ipcRenderer.invoke('get.disksInfo').then((data: any) => {
    disksInfo.value = data
  })
}

function getDisplayInfo() {
  displayInfo.value = []
  window.electron.ipcRenderer.invoke('get.displayInfo').then((data: any) => {
    displayInfo.value = data
  })
}

getSysInfo()
getBoardInfo()
getOsInfo()
getMemsInfo()
getDisksInfo()
getCpuInfo()
getDisplayInfo()
</script>

<style scoped>
ul {
  margin: 0;
}

.container {
  display: flex;
  justify-content: center;
}

.system-info {
  display: inline-block;
  font-size: 14px;
  line-height: 1.8em;
}

@media (min-width: 450px) {
  .system-info {
    columns: 1;
  }
}

@media (min-width: 900px) {
  .system-info {
    columns: 2;
  }
}

@media (min-width: 1350px) {
  .system-info {
    columns: 3;
  }
}

.info-item {
  position: relative;
  break-inside: avoid;
  width: 400px;
  margin: 20px;
  padding: 20px;
  border-radius: 10px;
  background-color: #88888815;
  transition-duration: 0.3s;
}

.info-item:hover {
  background-color: #88888830;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.2);
  transform: translate(-2px, -2px);
}

.item-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
}

.blur-info {
  filter: blur(5px);
}

.blur-info:hover {
  filter: blur(0);
}
</style>