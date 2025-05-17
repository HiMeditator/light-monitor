<template>
  <div class="process-analysis">
    <a-row :gutter="16">
      <a-col :span="12">
        <a-card title="异常检测规则" :bordered="false">
          <a-form layout="vertical">
            <a-form-item label="CPU使用率阈值">
              <a-input-number
                v-model:value="analysisRules.cpuThreshold"
                :min="0"
                :max="100"
                :step="5"
                addon-after="%"
              />
            </a-form-item>
            <a-form-item label="内存使用率阈值">
              <a-input-number
                v-model:value="analysisRules.memThreshold"
                :min="0"
                :max="100"
                :step="5"
                addon-after="%"
              />
            </a-form-item>
            <a-form-item label="检测间隔">
              <a-input-number
                v-model:value="analysisRules.checkInterval"
                :min="1"
                :max="60"
                :step="1"
                addon-after="秒"
              />
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="告警设置" :bordered="false">
          <a-form layout="vertical">
            <a-form-item label="告警方式">
              <a-checkbox-group v-model:value="analysisRules.alertMethods">
                <a-checkbox value="notification">系统通知</a-checkbox>
                <a-checkbox value="sound">声音提醒</a-checkbox>
              </a-checkbox-group>
            </a-form-item>
            <a-form-item label="告警级别">
              <a-radio-group v-model:value="analysisRules.alertLevel">
                <a-radio value="info">信息</a-radio>
                <a-radio value="warning">警告</a-radio>
                <a-radio value="error">错误</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>
    </a-row>

    <a-card title="异常进程列表" style="margin-top: 16px">
      <a-table
        :dataSource="abnormalProcesses"
        :columns="abnormalColumns"
        :pagination="{ pageSize: 5 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ record.status }}
            </a-tag>
          </template>
          <template v-if="column.dataIndex === 'action'">
            <a-space>
              <a-button type="link" @click="handleProcessAction(record, 'kill')">
                终止进程
              </a-button>
              <a-button type="link" @click="handleProcessAction(record, 'ignore')">
                忽略告警
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'

const props = defineProps<{
  processData: any[]
}>()

// 进程分析相关
const analysisRules = ref({
  cpuThreshold: 80,
  memThreshold: 80,
  checkInterval: 5,
  alertMethods: [] as ('notification' | 'sound')[],
  alertLevel: 'warning'
})

const abnormalProcesses = ref<any[]>([])
const abnormalColumns = [
  {
    title: '进程名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'PID',
    dataIndex: 'pid',
    key: 'pid',
  },
  {
    title: 'CPU使用率',
    dataIndex: 'cpu',
    key: 'cpu',
    render: (value: number) => `${value.toFixed(1)}%`
  },
  {
    title: '内存使用率',
    dataIndex: 'mem',
    key: 'mem',
    render: (value: number) => `${value.toFixed(1)}%`
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '首次检测时间',
    dataIndex: 'firstDetected',
    key: 'firstDetected',
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
  }
]

// 获取状态颜色
function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'CPU异常': 'red',
    '内存异常': 'orange',
    '僵尸进程': 'purple',
    '已忽略': 'gray'
  }
  return colorMap[status] || 'blue'
}

// 处理进程操作
function handleProcessAction(process: any, action: 'kill' | 'ignore') {
  if (action === 'kill') {
    window.electron.ipcRenderer.invoke('kill.process', process.pid).then(() => {
      message.success('进程已终止')
      abnormalProcesses.value = abnormalProcesses.value.filter(p => p.pid !== process.pid)
    }).catch(() => {
      message.error('终止进程失败')
    })
  } else {
    process.status = '已忽略'
    message.success('已忽略该进程的告警')
  }
}

// 检测异常进程
function checkAbnormalProcesses() {
  if (!props.processData?.length) return

  const now = new Date().toLocaleString()
  const abnormalList = props.processData.filter((proc: any) => {
    // 排除 system idle process
    if (proc.name.toLowerCase() === 'system idle process') {
      return false
    }

    // 排除已忽略的进程
    if (abnormalProcesses.value.find(p => p.pid === proc.pid && p.status === '已忽略')) {
      return false
    }

    // 检测CPU异常
    if (proc.cpu > analysisRules.value.cpuThreshold) {
      return true
    }

    // 检测内存异常
    if (proc.mem > analysisRules.value.memThreshold) {
      return true
    }

    // 检测僵尸进程
    if (proc.status === 'zombie') {
      return true
    }

    return false
  })

  // 更新异常进程列表
  abnormalList.forEach((proc: any) => {
    const existingProcess = abnormalProcesses.value.find(p => p.pid === proc.pid)
    if (existingProcess) {
      // 更新现有记录
      Object.assign(existingProcess, {
        cpu: proc.cpu,
        mem: proc.mem,
        status: getProcessStatus(proc)
      })
    } else {
      // 添加新记录
      abnormalProcesses.value.push({
        ...proc,
        firstDetected: now,
        status: getProcessStatus(proc)
      })

      // 发送告警
      sendAlert(proc)
    }
  })
}

// 获取进程状态
function getProcessStatus(proc: any): string {
  if (proc.cpu > analysisRules.value.cpuThreshold) {
    return 'CPU异常'
  }
  if (proc.mem > analysisRules.value.memThreshold) {
    return '内存异常'
  }
  if (proc.status === 'zombie') {
    return '僵尸进程'
  }
  return '未知'
}

// 发送告警
function sendAlert(process: any) {
  const alertMessage = `检测到异常进程：${process.name}\nPID: ${process.pid}\n状态: ${getProcessStatus(process)}`

  if (analysisRules.value.alertMethods.includes('notification')) {
    new Notification('进程异常告警', {
      body: alertMessage,
      icon: '/path/to/icon.png' // 需要设置适当的图标路径
    })
  }

  if (analysisRules.value.alertMethods.includes('sound')) {
    // 播放告警音效
    const audio = new Audio('/path/to/alert.mp3') // 需要设置适当的音效文件路径
    audio.play()
  }

  message[analysisRules.value.alertLevel](alertMessage)
}

// 启动定时检测
let checkTimer: number | null = null

watch(() => analysisRules.value.checkInterval, (newInterval) => {
  if (checkTimer) {
    clearInterval(checkTimer)
  }
  checkTimer = window.setInterval(checkAbnormalProcesses, newInterval * 1000)
})

// 监听进程数据变化
watch(() => props.processData, () => {
  checkAbnormalProcesses()
}, { deep: true })

// 组件卸载时清理
onUnmounted(() => {
  if (checkTimer) {
    clearInterval(checkTimer)
  }
})

// 初始化检测
checkAbnormalProcesses()
</script>

<style scoped>
.process-analysis {
  padding: 16px;
}

:deep(.ant-form-item) {
  margin-bottom: 16px;
}

:deep(.ant-card-head) {
  min-height: 48px;
}

:deep(.ant-table) {
  margin-top: 16px;
}
</style> 