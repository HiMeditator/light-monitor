<template>
  <div class="resource-charts">
    <div class="chart-controls">
      <a-space>
        <a-select v-model:value="processCount" style="width: 120px">
          <a-select-option :value="5">前5个进程</a-select-option>
          <a-select-option :value="10">前10个进程</a-select-option>
          <a-select-option :value="15">前15个进程</a-select-option>
          <a-select-option :value="20">前20个进程</a-select-option>
        </a-select>
        <a-button type="primary" @click="exportData">
          <template #icon><download-outlined /></template>
          导出数据
        </a-button>
        <a-select v-model:value="exportFormat" style="width: 100px">
          <a-select-option value="json">JSON</a-select-option>
          <a-select-option value="csv">CSV</a-select-option>
        </a-select>
        <a-button type="primary" @click="importData">
          <template #icon><upload-outlined /></template>
          导入数据
        </a-button>
        <input
          ref="fileInput"
          type="file"
          accept=".json,.csv"
          style="display: none"
          @change="handleFileChange"
        />
      </a-space>
    </div>

    <div class="charts-container">
      <div class="chart-wrapper">
        <h3>进程树状图</h3>
        <div ref="treeChartRef" class="chart"></div>
      </div>
      <div class="chart-wrapper">
        <h3>资源使用趋势</h3>
        <div ref="heatmapChartRef" class="chart"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons-vue'
import * as echarts from 'echarts'
import { message } from 'ant-design-vue'
import { sm4 } from 'sm-crypto'

const exportFormat = ref('json')
const processCount = ref(10)
const treeChartRef = ref<HTMLElement | null>(null)
const heatmapChartRef = ref<HTMLElement | null>(null)
let treeChart: echarts.ECharts | null = null
let heatmapChart: echarts.ECharts | null = null
let updateTimer: number | null = null

// 存储历史数据
const historyData = ref<{
  time: string;
  processes: Array<{
    name: string;
    cpu: number;
    mem: number;
  }>;
}[]>([])

// 资源使用统计
const cpuStats = ref({
  avg: 0,
  max: 0,
  min: 100,
  total: 0
})

const memStats = ref({
  avg: 0,
  max: 0,
  min: 100,
  total: 0
})

const props = defineProps<{
  processData: any[]
}>()

const fileInput = ref<HTMLInputElement | null>(null)

// 加密密钥（实际应用中应该从配置文件或环境变量中获取）
const SM4_KEY = '0123456789abcdeffedcba9876543210'

// 加密数据
function encryptData(data: string): string {
  try {
    // console.log('开始SM4加密...')
    // 使用SM4加密数据
    const sm4Encrypted = sm4.encrypt(data, SM4_KEY)
    // console.log('SM4加密完成，长度:', sm4Encrypted.length)
    
    // 返回加密后的数据
    const result = JSON.stringify({
      data: sm4Encrypted,
      timestamp: Date.now()
    })
    // console.log('加密结果JSON序列化完成，长度:', result.length)
    return result
  } catch (error: any) {
    // console.error('加密过程失败:', error)
    throw new Error(`加密失败: ${error.message || '未知错误'}`)
  }
}

// 解密数据
function decryptData(encryptedData: string): string {
  try {
    // 解析加密包装对象
    const wrapper = JSON.parse(encryptedData)
    if (!wrapper.encrypted || !wrapper.data) {
      throw new Error('无效的加密数据格式')
    }
    
    // 解码 Base64 数据
    const encryptedContent = atob(wrapper.data)
    
    // 解析加密内容
    const { data } = JSON.parse(encryptedContent)
    
    // 使用SM4解密数据
    const decryptedData = sm4.decrypt(data, SM4_KEY)
    // console.log('SM4解密数据完成')
    
    return decryptedData
  } catch (error: any) {
    console.error('解密失败:', error)
    throw new Error(`解密失败: ${error.message || '未知错误'}`)
  }
}

// 初始化图表
onMounted(() => {
  if (treeChartRef.value) {
    treeChart = echarts.init(treeChartRef.value)
  }
  if (heatmapChartRef.value) {
    heatmapChart = echarts.init(heatmapChartRef.value)
  }
  updateCharts()
})

// 监听数据变化
watch(() => props.processData, () => {
  if (updateTimer) {
    clearTimeout(updateTimer)
  }
  updateTimer = window.setTimeout(() => {
    // 更新历史数据
    const now = new Date()
    const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
    
    // 获取CPU和内存使用率最高的进程
    const topProcesses = [...props.processData]
      .filter(proc => proc.name.toLowerCase() !== 'system idle process')
      .sort((a, b) => Math.max(b.cpu, b.mem) - Math.max(a.cpu, a.mem))
      .slice(0, processCount.value)
      .map(proc => ({
        name: proc.name,
        cpu: proc.cpu,
        mem: proc.mem
      }))
    
    historyData.value.push({
      time: timeStr,
      processes: topProcesses
    })
    
    // 只保留最近30个数据点
    if (historyData.value.length > 30) {
      historyData.value.shift()
    }
    
    updateCharts()
  }, 500)
}, { deep: true })

// 监听进程数量变化
watch(processCount, () => {
  // 清空历史数据
  historyData.value = []
  // 立即更新图表
  updateCharts()
})

// 更新图表数据
function updateCharts() {
  if(!props.processData) {
    return
  }
  updateTreeChart()
  updateHeatmapChart()
}

// 更新树状图
function updateTreeChart() {
  if (!treeChart) return
  
  // 获取CPU和内存使用率最高的进程
  const topCpuProcesses = [...props.processData]
    .filter(proc => proc.name.toLowerCase() !== 'system idle process')
    .sort((a, b) => b.cpu - a.cpu)
    .slice(0, processCount.value)
  
  const topMemProcesses = [...props.processData]
    .filter(proc => proc.name.toLowerCase() !== 'system idle process')
    .sort((a, b) => b.mem - a.mem)
    .slice(0, processCount.value)
  
  // 合并进程并去重
  const processMap = new Map()
  topCpuProcesses.forEach(proc => {
    processMap.set(proc.pid, {
      ...proc,
      isTopCpu: true
    })
  })
  topMemProcesses.forEach(proc => {
    if (processMap.has(proc.pid)) {
      processMap.get(proc.pid).isTopMem = true
    } else {
      processMap.set(proc.pid, {
        ...proc,
        isTopMem: true
      })
    }
  })
  
  const topProcesses = Array.from(processMap.values())
  
  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter: (params: any) => {
        const proc = topProcesses.find(p => p.name === params.name.split(' (')[0])
        if (!proc) return params.name
        let tip = `${proc.name}\n`
        if (proc.isTopCpu) tip += `CPU: ${proc.cpu.toFixed(1)}%\n`
        if (proc.isTopMem) tip += `内存: ${proc.mem.toFixed(1)}%`
        return tip
      }
    },
    series: [
      {
        type: 'tree',
        data: [{
          name: '系统进程',
          children: topProcesses.map(proc => ({
            name: `${proc.name} (${proc.isTopCpu ? `CPU:${proc.cpu.toFixed(1)}%` : ''}${proc.isTopCpu && proc.isTopMem ? ' ' : ''}${proc.isTopMem ? `MEM:${proc.mem.toFixed(1)}%` : ''})`,
            value: Math.max(proc.cpu, proc.mem),
            children: []
          }))
        }],
        top: '5%',
        left: '20%',
        bottom: '5%',
        right: '40%',
        symbolSize: 10,
        label: {
          position: 'left',
          verticalAlign: 'middle',
          align: 'right',
          fontSize: 12,
          backgroundColor: '#fff',
          padding: [4, 8],
          borderRadius: 4
        },
        leaves: {
          label: {
            position: 'right',
            verticalAlign: 'middle',
            align: 'left',
            distance: 0
          }
        },
        emphasis: {
          focus: 'descendant',
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.2)'
          }
        },
        expandAndCollapse: true,
        animationDuration: 550,
        animationDurationUpdate: 750,
        initialTreeDepth: 1
      }
    ]
  }
  
  treeChart.setOption(option)
}

// 更新折线图
function updateHeatmapChart() {
  if (!heatmapChart) return
  
  const times = historyData.value.map(item => item.time)
  const topProcesses = historyData.value[historyData.value.length - 1]?.processes || []
  
  // 过滤掉 system idle process
  const filteredProcesses = topProcesses.filter(proc => 
    proc.name.toLowerCase() !== 'system idle process'
  )

  // 计算所有数据中的最大值
  const maxValue = Math.max(
    ...historyData.value.flatMap(item => 
      item.processes
        .filter(proc => proc.name.toLowerCase() !== 'system idle process')
        .map(proc => Math.max(proc.cpu, proc.mem))
    )
  )
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let result = params[0].name + '<br/>'
        params.forEach((param: any) => {
          const color = param.color
          const value = param.value
          const seriesName = param.seriesName
          result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>`
          result += `${seriesName}: ${value.toFixed(1)}%<br/>`
        })
        return result
      }
    },
    legend: {
      data: filteredProcesses.map(proc => [
        `${proc.name} (CPU)`,
        `${proc.name} (内存)`
      ]).flat(),
      type: 'scroll',
      bottom: 0,
      textStyle: {
        fontSize: 12
      }
    },
    grid: {
      top: '5%',
      bottom: '15%',
      left: '3%',
      right: '4%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: times,
      axisLabel: {
        interval: 'auto',
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '使用率 (%)',
      min: 0,
      max: Math.ceil(maxValue * 1.1), // 最大值向上取整并增加10%的空间
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: filteredProcesses.map(proc => [
      {
        name: `${proc.name} (CPU)`,
        type: 'line',
        data: historyData.value.map(item => 
          item.processes.find(p => p.name === proc.name)?.cpu || 0
        ),
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2
        },
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: `${proc.name} (内存)`,
        type: 'line',
        data: historyData.value.map(item => 
          item.processes.find(p => p.name === proc.name)?.mem || 0
        ),
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          type: 'dashed'
        },
        emphasis: {
          focus: 'series'
        }
      }
    ]).flat()
  }
  
  heatmapChart.setOption(option)
}

// 计算资源使用统计
function calculateStats() {
  if (!historyData.value.length) return

  const cpuValues: number[] = []
  const memValues: number[] = []
  let totalCpu = 0
  let totalMem = 0

  historyData.value.forEach(item => {
    let itemTotalCpu = 0
    let itemTotalMem = 0
    item.processes.forEach(proc => {
      cpuValues.push(proc.cpu)
      memValues.push(proc.mem)
      itemTotalCpu += proc.cpu
      itemTotalMem += proc.mem
    })
    totalCpu += itemTotalCpu
    totalMem += itemTotalMem
  })

  // 计算CPU统计
  cpuStats.value = {
    avg: cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length,
    max: Math.max(...cpuValues),
    min: Math.min(...cpuValues),
    total: totalCpu / historyData.value.length
  }

  // 计算内存统计
  memStats.value = {
    avg: memValues.reduce((a, b) => a + b, 0) / memValues.length,
    max: Math.max(...memValues),
    min: Math.min(...memValues),
    total: totalMem / historyData.value.length
  }
}

// 监听数据变化时更新统计
watch(() => historyData.value, () => {
  calculateStats()
}, { deep: true })

// 导出数据
function exportData() {
  try {
    // console.log('开始导出数据...')
    const data = props.processData
    if (!data || !Array.isArray(data)) {
      throw new Error('无效的数据格式')
    }

    let content = ''
    let filename = ''
    
    if (exportFormat.value === 'json') {
      content = JSON.stringify(data, null, 2)
      filename = 'process_data.encrypted.json'
    } else {
      const headers = ['pid', 'name', 'cpu', 'mem', 'parentPid']
      const csvContent = [
        headers.join(','),
        ...data.map(item => headers.map(header => item[header]).join(','))
      ].join('\n')
      content = csvContent
      filename = 'process_data.encrypted.csv'
    }
    
    // console.log('数据格式化完成，开始加密...')
    // console.log('原始数据:', content)
    
    // 加密数据
    const encryptedContent = encryptData(content)
    // console.log('加密后数据:', encryptedContent)
    
    // 将加密后的内容转换为 Base64 格式
    const base64Content = btoa(encryptedContent)
    // console.log('Base64编码后:', base64Content)
    
    // 创建加密数据的包装对象
    const encryptedWrapper = {
      encrypted: true,
      version: '1.0',
      data: base64Content,
      timestamp: Date.now()
    }
    
    // 将包装对象转换为字符串
    const finalContent = JSON.stringify(encryptedWrapper)
    
    const blob = new Blob([finalContent], { type: 'application/json' })
    // console.log('Blob创建完成，大小:', blob.size)
    
    const url = URL.createObjectURL(blob)
    // console.log('URL创建完成:', url)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    message.success('数据已加密导出成功')
  } catch (error: any) {
    console.error('导出失败，详细错误:', error)
    message.error(`数据导出失败: ${error.message || '未知错误'}`)
  }
}

// 导入数据
function importData() {
  fileInput.value?.click()
}

// 处理文件选择
async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) {
    return
  }

  const file = input.files[0]
  try {
    const content = await file.text()
    // console.log('读取到的文件内容:', content)

    // 尝试解析为JSON
    const parsed = JSON.parse(content)
    
    // 检查是否是加密文件
    if (parsed.encrypted && parsed.data) {
      try {
        // 解密数据
        const decryptedData = decryptData(content)
        // console.log('解密后的数据:', decryptedData)
        
        // 显示解密后的数据
        message.success('数据解密成功')
        
        // 创建一个新文件下载解密后的数据
        const blob = new Blob([decryptedData], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `decrypted_${file.name}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } catch (error: any) {
        console.error('解密失败:', error)
        message.error(`解密失败: ${error.message || '未知错误'}`)
      }
    } else {
      message.warning('这不是一个加密文件')
    }
  } catch (error: any) {
    console.error('文件读取失败:', error)
    message.error(`文件读取失败: ${error.message || '未知错误'}`)
  }

  // 清空文件输入，允许重复选择同一文件
  input.value = ''
}

// 组件卸载时清理
onUnmounted(() => {
  if (treeChart) {
    treeChart.dispose()
    treeChart = null
  }
  if (heatmapChart) {
    heatmapChart.dispose()
    heatmapChart = null
  }
  if (updateTimer) {
    clearTimeout(updateTimer)
  }
})
</script>

<style scoped>
.resource-charts {
  padding: 20px;
}

.chart-controls {
  margin-bottom: 20px;
}

.charts-container {
  display: flex;
  gap: 20px;
  height: 600px;
  flex-wrap: wrap;
}

.chart-wrapper {
  flex: 1;
  min-width: 500px;
  display: flex;
  flex-direction: column;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

@media (max-width: 1200px) {
  .chart-wrapper {
    flex: 1 1 100%;
    min-width: 100%;
  }
  
  .charts-container {
    height: auto;
  }
}

.chart-wrapper h3 {
  margin: 0;
  padding: 10px;
  background-color: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  font-size: 16px;
  font-weight: 500;
}

.chart {
  flex: 1;
  min-height: 500px;
}

.trend-report {
  margin-top: 20px;
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.trend-report h3 {
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 500;
}

:deep(.ant-statistic-title) {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

:deep(.ant-statistic-content) {
  font-size: 24px;
  font-weight: 500;
}
</style> 