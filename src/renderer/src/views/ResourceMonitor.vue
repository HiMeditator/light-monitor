<template>
  <div class="resource-monitor">
    <a-row :gutter="16">
      <!-- 资源使用率卡片 -->
      <a-col :span="6" v-for="(metric, index) in metrics" :key="index">
        <a-card :bordered="false">
          <statistic
            :title="metric.title"
            :value="metric.value"
            :precision="1"
            :value-style="{ color: getMetricColor(metric.value) }"
          >
            <template #suffix>%</template>
          </statistic>
        </a-card>
      </a-col>
    </a-row>

    <!-- 图表区域 -->
    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="12">
        <a-card title="资源使用趋势" :bordered="false">
          <div class="chart-container">
            <div ref="trendChartRef" style="width: 100%; height: 300px"></div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="资源热力图" :bordered="false">
          <div class="chart-container">
            <div ref="heatmapChartRef" style="width: 100%; height: 300px"></div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 文件系统监控 -->
    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="12">
        <a-card title="文件系统监控" :bordered="false">
          <a-table :columns="fileSystemColumns" :data-source="fileSystemData" :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ record.status }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="文件操作日志" :bordered="false">
          <a-timeline>
            <a-timeline-item v-for="log in fileOperationLogs" :key="log.id" :color="log.color">
              {{ log.time }} - {{ log.operation }}
            </a-timeline-item>
          </a-timeline>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Statistic } from 'ant-design-vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

// 资源指标数据
const metrics = ref([
  { title: 'CPU使用率', value: 0 },
  { title: '内存使用率', value: 0 },
  { title: '磁盘使用率', value: 0 },
  { title: '网络使用率', value: 0 }
])

// 图表引用
const trendChartRef = ref<HTMLElement>()
const heatmapChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let heatmapChart: echarts.ECharts | null = null

// 历史数据
const historyData = ref<{
  time: Date;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}[]>([])

// 文件系统数据
const fileSystemColumns = [
  { title: '磁盘', dataIndex: 'disk', key: 'disk' },
  { title: '总容量', dataIndex: 'total', key: 'total' },
  { title: '已用空间', dataIndex: 'used', key: 'used' },
  { title: '读写速率', dataIndex: 'ioRate', key: 'ioRate' },
  { title: '状态', dataIndex: 'status', key: 'status' }
]

const fileSystemData = ref<any[]>([])
const fileOperationLogs = ref<any[]>([])

// 热力图配置
const heatmapConfig = ref({
  timeRange: 12, // 显示最近12个时间点（10秒一个点，共2分钟）
  updateInterval: 2000, // 每10秒更新一次
  maxDataPoints: 100 // 最多保存100个数据点
})

// 获取系统资源数据
async function getSystemResources() {
  try {
    const data = await window.electron.ipcRenderer.invoke('get.systemResources')
    
    // 更新指标数据
    metrics.value[0].value = data.cpu.usage
    metrics.value[1].value = data.memory.usage
    metrics.value[2].value = data.disk.reduce((acc, disk) => acc + disk.usage, 0) / data.disk.length
    metrics.value[3].value = data.network.reduce((acc, net) => acc + (net.rx_sec + net.tx_sec), 0)

    console.log( JSON.stringify(metrics.value))
    // 更新历史数据
    const now = new Date()
    historyData.value.push({
      time: now,
      cpu: data.cpu.usage,
      memory: data.memory.usage,
      disk: data.disk.reduce((acc, disk) => acc + disk.usage, 0) / data.disk.length,
      network: data.network.reduce((acc, net) => acc + (net.rx_sec + net.tx_sec), 0)
    })

    // 只保留最近100个数据点
    if (historyData.value.length > 100) {
      historyData.value.shift()
    }

    // 更新文件系统数据
    fileSystemData.value = data.disk.map(disk => ({
      key: disk.fs,
      disk: disk.fs,
      total: formatBytes(disk.size),
      used: formatBytes(disk.used),
      ioRate: '获取失败', // 需要额外的IO监控
      status: getDiskStatus(disk)
    }))

    // 更新图表
    updateCharts()
  } catch (error) {
    console.error('获取系统资源数据失败:', error)
  }
}

// 格式化字节数
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取磁盘状态
function getDiskStatus(disk: any): string {
  if (disk.usage >= 90) return '异常'
  if (disk.usage >= 70) return '警告'
  return '正常'
}

// 获取指标颜色
function getMetricColor(value: number): string {
  if (value >= 90) return '#cf1322'
  if (value >= 70) return '#faad14'
  return '#3f8600'
}

// 获取状态颜色
function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    '正常': 'green',
    '警告': 'orange',
    '异常': 'red'
  }
  return colorMap[status] || 'blue'
}

// 更新图表数据
function updateCharts() {
  if (!historyData.value.length) return
  
  // 定义系列名称到数据字段的映射
  const seriesFieldMap: Record<string, keyof typeof historyData.value[number]> = {
    'CPU': 'cpu',
    '内存': 'memory',
    '磁盘': 'disk'
  }
  // 更新趋势图数据
  if (trendChart) {
    const series = trendChart.getOption().series as any[]
    const newSeries = series.map(s => {
      const field = seriesFieldMap[s.name]
      const data = historyData.value.map(item => [
        item.time.getTime(),
        item[field]
      ])
      return {
        ...s,
        data
      }
    })
    trendChart.setOption({ series: newSeries }, { notMerge: false })
  }
  
  // 更新热力图数据
  if (heatmapChart) {
    const heatmapData: [number, number, number][] = []
    const resources = ['CPU', '内存', '磁盘', '网络']
    
    // 获取最近N个时间点的数据
    const now = new Date()
    const timeRangeAgo = new Date(now.getTime() - heatmapConfig.value.timeRange * 10 * 1000)
    const recentData = historyData.value.filter(item => item.time >= timeRangeAgo)
    
    const timeGroups = new Map<number, typeof recentData>()
    recentData.forEach(item => {
      // 计算相对于当前时间的10秒间隔偏移
      const timeDiff = now.getTime() - item.time.getTime()
      const timeOffset = Math.floor(timeDiff / (10 * 1000))
      if (timeOffset < heatmapConfig.value.timeRange) {
        if (!timeGroups.has(timeOffset)) {
          timeGroups.set(timeOffset, [])
        }
        timeGroups.get(timeOffset)?.push(item)
      }
    })
    
    // 计算每个时间点的平均使用率
    resources.forEach((_, resourceIndex) => {
      const resourceKey = resourceIndex === 0 ? 'cpu' :
                        resourceIndex === 1 ? 'memory' :
                        resourceIndex === 2 ? 'disk' : 'network'
      
      for (let timeOffset = 0; timeOffset < heatmapConfig.value.timeRange; timeOffset++) {
        const timeData = timeGroups.get(timeOffset) || []
        const avgUsage = timeData.length ?
          timeData.reduce((acc, item) => acc + item[resourceKey], 0) / timeData.length :
          0
        
        heatmapData.push([timeOffset, resourceIndex, avgUsage])
      }
    })
    
    // 更新x轴标签（从最新时间开始倒序）
    const timeLabels = Array.from({ length: heatmapConfig.value.timeRange }, (_, i) => {
      const seconds = (heatmapConfig.value.timeRange - 1 - i) * 10
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    })
    
    heatmapChart.setOption({
      xAxis: {
        data: timeLabels
      },
      series: [{
        data: heatmapData
      }]
    }, { notMerge: false })
  }
}

// 初始化趋势图
function initTrendChart() {
  if (!trendChartRef.value) return
  
  trendChart = echarts.init(trendChartRef.value)
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!params || !params.length) return ''
        const time = new Date(params[0].value[0]).toLocaleTimeString()
        let result = `${time}<br/>`
        params.forEach((param: any) => {
          if (param.value && param.value[1] !== undefined) {
            result += `${param.seriesName}: ${Number(param.value[1]).toFixed(2)}%<br/>`
          }
        })
        return result
      }
    },
    legend: {
      data: ['CPU', '内存', '磁盘'],
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '40px',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      axisLabel: {
        formatter: (value: number) => {
          return new Date(value).toLocaleTimeString()
        }
      }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: 'CPU',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: [],
        itemStyle: {
          color: '#1890ff'
        }
      },
      {
        name: '内存',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: [],
        itemStyle: {
          color: '#52c41a'
        }
      },
      {
        name: '磁盘',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: [],
        itemStyle: {
          color: '#faad14'
        }
      }
    ]
  }
  trendChart.setOption(option)
}


// 初始化热力图
function initHeatmapChart() {
  if (!heatmapChartRef.value) return
  
  heatmapChart = echarts.init(heatmapChartRef.value)
  const option: EChartsOption = {
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        if (!params || !params.value || params.value[2] === undefined) return ''
        return `${Number(params.value[2]).toFixed(2)}%`
      }
    },
    grid: {
      height: '50%',
      top: '10%'
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: heatmapConfig.value.timeRange }, (_, i) => {
        const seconds = (heatmapConfig.value.timeRange - 1 - i) * 10
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
      }),
      splitArea: {
        show: true
      },
      axisLabel: {
        interval: 1, // 每2个标签显示一个
        rotate: 45
      }
    },
    yAxis: {
      type: 'category',
      data: ['CPU', '内存', '磁盘', '网络'],
      splitArea: {
        show: true
      }
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '15%',
      text: ['高', '低'],
      formatter: '{value}%'
    },
    series: [{
      name: '资源使用率',
      type: 'heatmap',
      data: [],
      label: {
        show: true,
        formatter: (params: any) => {
          if (!params || !params.value || params.value[2] === undefined) return ''
          return `${Number(params.value[2]).toFixed(2)}%`
        }
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
  heatmapChart.setOption(option)
}

// 定时器
let updateTimer: number | null = null

onMounted(() => {
  initTrendChart()
  initHeatmapChart()
  getSystemResources() // 立即获取一次数据
  updateTimer = window.setInterval(getSystemResources, heatmapConfig.value.updateInterval)
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    trendChart?.resize()
    heatmapChart?.resize()
  })
})

onUnmounted(() => {
  if (updateTimer) {
    clearInterval(updateTimer)
  }
  trendChart?.dispose()
  heatmapChart?.dispose()
})
</script>

<style scoped>
.resource-monitor {
  padding: 16px;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 300px;
}

:deep(.ant-card) {
  margin-bottom: 16px;
}

:deep(.ant-timeline) {
  max-height: 300px;
  overflow-y: auto;
}
</style> 