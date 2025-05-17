<template>
  <div class="monitor">
    <h2>传感器数据</h2>
    <a-row style="margin-bottom: 20px;">
      <a-col :span="5">
        <a-statistic title="电池电压" :value="batteryInfo.voltage" />
      </a-col>
      <a-col :span="5">
        <a-statistic title="CPU平均核心温度" :value="cpuTempInfo.main || '读取失败'" />
      </a-col>
      <a-col :span="5">
        <a-statistic title="CPU最大核心温度" :value="cpuTempInfo.max || '读取失败'" />
      </a-col>
      <a-col :span="5">
        <a-statistic title="风扇转速" :value="'读取失败'" />
      </a-col>
    </a-row>
    <h2>进程统计</h2>
    <a-row style="margin-bottom: 20px;">
      <a-col :span="5">
        <a-statistic title="全部进程" :value="procInfo.all" />
      </a-col>
      <a-col :span="5">
        <a-statistic title="运行进程" :value="procInfo.running" />
      </a-col>
      <a-col :span="5">
        <a-statistic title="阻塞进程" :value="procInfo.blocked" />
      </a-col>
      <a-col :span="5">
        <a-statistic title="休眠进程" :value="procInfo.sleeping" />
      </a-col>
      <a-col :span="4">
        <a-statistic title="未知状态" :value="procInfo.unknown" />
      </a-col>
    </a-row>
    <a-tabs v-model:activeKey="activeKey">
      <a-tab-pane key="1" tab="进程列表">
        <div class="proc-table">
          <h2>进程列表</h2>
          <a-table :scroll="{ x: 'max-content' }" class="proc-table" :dataSource="procInfo.list" :columns="procCol">
            <template #bodyCell="{ column, text }">
              <template v-if="column.dataIndex === 'cpu'">{{ text.toFixed(3) }}%</template>
              <template v-if="column.dataIndex === 'mem'">{{ text.toFixed(3) }}%</template>
            </template>
          </a-table>
        </div>
      </a-tab-pane>
      <a-tab-pane key="2" tab="资源图表"></a-tab-pane>
      <a-tab-pane key="3" tab="Tab 3"></a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const activeKey = ref('1');
const procCol = [
  {
    title: 'pid',
    dataIndex: 'pid',
    key: 'pid',
    sorter: {
      compare: (a: any, b: any) => a.pid - b.pid,
      multiple: 1
    }
  },
  {
    title: 'parentPid',
    dataIndex: 'parentPid',
    key: 'parentPid',
  },
  {
    title: 'name',
    dataIndex: 'name',
    key: 'name',
    sorter: {
      compare: (a: any, b: any) => a.name.localeCompare(b.name),
      multiple: 2
    }
  },
  {
    title: 'CPU',
    dataIndex: 'cpu',
    key: 'cpu',
    sorter: {
      compare: (a: any, b: any) => a.cpu - b.cpu,
      multiple: 3
    }
  },
  {
    title: 'Memory',
    dataIndex: 'mem',
    key: 'mem',
    sorter: {
      compare: (a: any, b: any) => a.mem - b.mem,
      multiple: 4
    }
  },
  {
    title: 'nice',
    dataIndex: 'nice',
    key: 'nice'
  },
  {
    title: 'started',
    dataIndex: 'started',
    key: 'started'
  }
]
const procInfo = ref<any>({})
const batteryInfo = ref<any>({})
const cpuTempInfo = ref<any>({})

function getProcInfo() {
  window.electron.ipcRenderer.invoke('get.procInfo').then((data: any) => {
    procInfo.value = data
  })
}
function getBatteryInfo() {
  window.electron.ipcRenderer.invoke('get.batteryInfo').then((data: any) => {
    batteryInfo.value = data
  })
}
function getCpuTempInfo() {
  window.electron.ipcRenderer.invoke('get.cpuTempInfo').then((data: any) => {
    cpuTempInfo.value = data
  })
}

getProcInfo()
getBatteryInfo()
getCpuTempInfo()

setInterval(() => {
  getProcInfo()
  getBatteryInfo()
  getCpuTempInfo()
}, 2000)
</script>

<style scoped>
h2 {
  font-size: 24px;
  line-height: 1.6em;
}
.monitor {
  width: 90%;
  margin-left: 5%;
  padding: 20px;
}

.proc-table {
  margin-top: 20px;
}
</style>