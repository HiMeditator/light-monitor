<template>
<div class="container">
  <div class="system-info">

    <div class="info-item">
      <div class="item-title">
        <FontAwesomeIcon :icon="faChartSimple" /> 系统服务状态
        <FontAwesomeIcon
          :icon="faArrowsRotate"
          title="获取最新信息"
          class="refresh-btn"
          @click="getProcInfo()"
        />
      </div>
      <div><b>全部进程：</b>{{ procInfo.all }}</div>
      <ul>
        <li><div><b>运行进程：</b>{{ procInfo.running }}</div></li>
        <li><div><b>阻塞进程：</b>{{ procInfo.blocked }}</div></li>
        <li><div><b>休眠进程：</b>{{ procInfo.sleeping }}</div></li>
        <li><div><b>未知状态：</b>{{ procInfo.unknown }}</div></li>
      </ul>
    </div>

    <div class="info-item">
      <div class="item-title">
        <FontAwesomeIcon :icon="faList" /> 已加载模块
        <FontAwesomeIcon
          :icon="faArrowsRotate"
          title="获取最新信息"
          class="refresh-btn"
          @click="getProcInfo()"
        />
      </div>
      <a-table
        style="width: calc(100% + 32px); margin-left: -8px;margin-top: 8px;"
        :scroll="{ x: 'max-content' }"
        class="proc-table"
        :dataSource="procInfo.list"
        :columns="procCol"
        size="small"
      />
    </div>

    <div class="info-item">
      <div class="item-title">
        <FontAwesomeIcon :icon="faComputer" /> 设备信息
      </div>
      <div><b>生产商：</b>{{ sysInfo.manufacturer }}</div>
      <div><b>设备型号：</b>{{ sysInfo.model }}</div>
      <div><b>设备版本：</b>{{ sysInfo.version }}</div>
      <div><b>设备序列号：</b>{{ sysInfo.serial }}</div>
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
      <div><b>内存容量：</b>{{ (mem.size / 1024 / 1024 / 1024).toFixed(3) }} G</div>
      <div><b>内存类型：</b>{{ mem.type }}</div>
    </div>

    <div v-for="(disk, idx) in disksInfo" class="info-item">
      <div class="item-title"><FontAwesomeIcon :icon="faHardDrive" /> 磁盘{{idx+1}}信息</div>
      <div><b>生产商：</b>{{ disk.vendor }}</div>
      <div><b>磁盘类型：</b>{{ disk.type }} M</div>
      <div><b>磁盘名称：</b>{{ disk.name }} M</div>
      <div><b>设备路径：</b>{{ disk.device }} M</div>
      <div><b>磁盘容量：</b>{{ (disk.size / 1024 / 1024 / 1024).toFixed(3) }} G</div>
      <div><b>磁盘序列号：</b>{{ disk.serialNum }}</div>
      <div><b>磁盘SMART状态：</b>{{ disk.smartStatus }}</div>
      <div><b>磁盘SMART状态：</b>{{ disk.smartData || "未获取" }}</div>
    </div>

    <div v-for="idx in displayInfo.controllers?.length" class="info-item">
      <div class="item-title"><FontAwesomeIcon :icon="faDisplay" /> 显示器{{idx}}信息</div>
      <div><b>控制器型号：</b>{{ displayInfo.controllers[idx-1].model }}</div>
      <div><b>控制器总线类型：</b>{{ displayInfo.controllers[idx-1].bus }}</div>
      <div><b>显存大小：</b>{{ displayInfo.controllers[idx-1].vram }} MB</div>
      <div><b>显示器制造商：</b>{{ displayInfo.displays[idx-1].vendor }}</div>
      <div><b>显示器型号：</b>{{ displayInfo.displays[idx-1].model }}</div>
      <div><b>分辨率：</b>{{ displayInfo.displays[idx-1].resolutionX }} x {{ displayInfo.displays[idx-1].resolutionY }}</div>
      <div><b>刷新率：</b>{{ displayInfo.displays[idx-1].currentRefreshRate }} Hz</div>
    </div>

  </div>
</div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { 
  faArrowsRotate, faChartSimple, faList,
  faComputer, faMemory, faHardDrive,
  faMicrochip, faDisplay, faLayerGroup
} from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'

const procCol = [
  { 
    title: 'pid',
    dataIndex: 'pid',
    key: 'pid',
    sorter:{
      compare: (a: any, b: any) => a.pid - b.pid,
      multiple: 1
    }
  },
  {
    title: 'name',
    dataIndex: 'name',
    key: 'name',
    sorter:{
      compare: (a: any, b: any) => a.name.localeCompare(b.name),
      multiple: 2
    }
  },
  {
    title: 'memVsz',
    dataIndex: 'memVsz',
    key: 'memVsz',
    sorter:{
      compare: (a: any, b: any) => a.memVsz - b.memVsz,
      multiple: 3
    }
  },
  {
    title: 'memRss',
    dataIndex: 'memRss',
    key: 'memRss',
    sorter:{
      compare: (a: any, b: any) => a.memRss - b.memRss,
      multiple: 4
    }
  },
  {
    title: 'started',
    dataIndex: 'started',
    key: 'started',
    // sorter:{
    //   compare: (a: any, b: any) => a.memRss - b.memRss,
    //   multiple: 4
    // }
  }
]
const procInfo = ref<any>({})
const sysInfo = ref<any>({})
const osInfo = ref<any>({})
const cpuInfo = ref<any>({})
const memsInfo = ref<any>([])
const disksInfo = ref<any[]>([])
const displayInfo = ref<any>([])

function getProcInfo() {
  procInfo.value = {}
  window.electron.ipcRenderer.invoke('get.procInfo').then((data: any) => {
    procInfo.value = data
  })
}

function getSysInfo() {
  sysInfo.value = {}
  window.electron.ipcRenderer.invoke('get.sysInfo').then((data: any) => {
    sysInfo.value = data
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

getProcInfo()
getSysInfo()
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

.refresh-btn {
  position: absolute;
  right: 25px;
  padding: 5px;
  border-radius: 5px;
  display: none;
}

.info-item:hover .refresh-btn,
.info-proc:hover .refresh-btn {
  display: inline-block;
}

.refresh-btn:hover {
  display: inline-block;
  cursor: pointer;
  background-color: #88888830;
}

.item-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
}
</style>