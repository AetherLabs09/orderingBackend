<template>
  <div class="statistics">
    <el-card style="margin-bottom: 20px">
      <el-form :inline="true">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="统计方式">
          <el-select v-model="statType">
            <el-option label="按日统计" value="day" />
            <el-option label="按周统计" value="week" />
            <el-option label="按月统计" value="month" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="handleExport">导出报表</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>销售趋势</span>
          </template>
          <div ref="salesChartRef" style="height: 400px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>热销菜品TOP10</span>
          </template>
          <div ref="dishesChartRef" style="height: 400px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>热销菜品详情</span>
      </template>
      <el-table :data="hotDishes" style="width: 100%">
        <el-table-column prop="name" label="菜品名称" />
        <el-table-column prop="total_sales" label="销量" width="120" />
        <el-table-column prop="total_revenue" label="销售额" width="120">
          <template #default="{ row }">
            ¥{{ row.total_revenue }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const salesChartRef = ref(null)
const dishesChartRef = ref(null)
const dateRange = ref([])
const statType = ref('day')
const hotDishes = ref([])

const loadData = async () => {
  loadSalesChart()
  loadDishesChart()
  loadHotDishes()
}

const loadSalesChart = async () => {
  try {
    const params = { type: statType.value }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    
    const res = await api.get('/statistics/sales', { params })
    const chart = echarts.init(salesChartRef.value)
    
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['订单数', '销售额']
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
          name: '销售额(元)'
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
          name: '销售额',
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

const loadDishesChart = async () => {
  try {
    const params = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    
    const res = await api.get('/statistics/hot-dishes', { params })
    const chart = echarts.init(dishesChartRef.value)
    
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value'
      },
      yAxis: {
        type: 'category',
        data: res.map(item => item.name).reverse()
      },
      series: [
        {
          name: '销量',
          type: 'bar',
          data: res.map(item => item.total_sales).reverse()
        }
      ]
    }
    
    chart.setOption(option)
  } catch (error) {
    console.error(error)
  }
}

const loadHotDishes = async () => {
  try {
    const params = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    
    const res = await api.get('/statistics/hot-dishes', { params })
    hotDishes.value = res
  } catch (error) {
    console.error(error)
  }
}

const handleExport = async () => {
  try {
    const params = { type: 'orders' }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    
    const res = await api.get('/statistics/export', { params })
    
    let csv = '日期,订单数,销售额\n'
    res.forEach(item => {
      csv += `${item.date},${item.order_count},${item.revenue}\n`
    })
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `销售报表_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  loadData()
})
</script>
