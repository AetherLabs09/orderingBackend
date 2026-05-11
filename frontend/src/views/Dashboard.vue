<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #409EFF">
              <el-icon size="30"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.today.order_count || 0 }}</div>
              <div class="stat-label">今日订单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #67C23A">
              <el-icon size="30"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ stats.today.revenue || 0 }}</div>
              <div class="stat-label">今日营收</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #E6A23C">
              <el-icon size="30"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total.total_users || 0 }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #F56C6C">
              <el-icon size="30"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ stats.total.total_revenue || 0 }}</div>
              <div class="stat-label">总营收</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>销售趋势</span>
          </template>
          <div ref="chartRef" style="height: 400px"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>热销菜品</span>
          </template>
          <el-table :data="hotDishes" style="width: 100%">
            <el-table-column prop="name" label="菜品名称" />
            <el-table-column prop="total_sales" label="销量" width="80" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import api from '@/utils/api'

const chartRef = ref(null)
const stats = ref({
  today: {},
  total: {}
})
const hotDishes = ref([])

const loadStats = async () => {
  try {
    const res = await api.get('/statistics/overview')
    stats.value = res
  } catch (error) {
    console.error(error)
  }
}

const loadHotDishes = async () => {
  try {
    const res = await api.get('/statistics/hot-dishes')
    hotDishes.value = res
  } catch (error) {
    console.error(error)
  }
}

const loadSalesChart = async () => {
  try {
    const res = await api.get('/statistics/sales')
    const chart = echarts.init(chartRef.value)
    
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['订单数', '营收']
      },
      xAxis: {
        type: 'category',
        data: res.map(item => item.date)
      },
      yAxis: [
        {
          type: 'value',
          name: '订单数'
        },
        {
          type: 'value',
          name: '营收(元)'
        }
      ],
      series: [
        {
          name: '订单数',
          type: 'line',
          data: res.map(item => item.order_count),
          smooth: true
        },
        {
          name: '营收',
          type: 'bar',
          yAxisIndex: 1,
          data: res.map(item => item.revenue)
        }
      ]
    }
    
    chart.setOption(option)
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  loadStats()
  loadHotDishes()
  loadSalesChart()
})
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 5px;
}
</style>
