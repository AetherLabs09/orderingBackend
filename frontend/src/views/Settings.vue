<template>
  <div class="settings">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>基础配置</span>
          </template>
          <el-form :model="form" label-width="120px">
            <el-form-item label="店铺名称">
              <el-input v-model="form.shop_name" placeholder="请输入店铺名称" />
            </el-form-item>
            <el-form-item label="营业开始时间">
              <el-time-select
                v-model="form.business_hours_start"
                start="00:00"
                step="00:30"
                end="23:30"
                placeholder="选择时间"
              />
            </el-form-item>
            <el-form-item label="营业结束时间">
              <el-time-select
                v-model="form.business_hours_end"
                start="00:00"
                step="00:30"
                end="23:30"
                placeholder="选择时间"
              />
            </el-form-item>
            <el-form-item label="接单开关">
              <el-switch v-model="form.accept_orders" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item label="图片大小限制">
              <el-input-number v-model="form.max_image_size" :min="1" :max="20" />
              <span style="margin-left: 10px">MB</span>
            </el-form-item>
            <el-form-item label="自动取消时间">
              <el-input-number v-model="form.auto_cancel_minutes" :min="5" :max="120" />
              <span style="margin-left: 10px">分钟</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSave">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>数据备份</span>
          </template>
          <el-button type="primary" @click="handleBackup">立即备份</el-button>
          <el-button @click="loadBackups">查看备份列表</el-button>
          
          <el-table :data="backups" style="width: 100%; margin-top: 20px" v-if="backups.length > 0">
            <el-table-column prop="name" label="文件名" />
            <el-table-column prop="size" label="大小" width="100">
              <template #default="{ row }">
                {{ formatSize(row.size) }}
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180" />
          </el-table>
        </el-card>
        
        <el-card style="margin-top: 20px">
          <template #header>
            <span>操作日志</span>
          </template>
          <el-table :data="logs" style="width: 100%">
            <el-table-column prop="employee_name" label="操作人" width="100" />
            <el-table-column prop="action" label="操作" />
            <el-table-column prop="created_at" label="时间" width="180" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const form = reactive({
  shop_name: '',
  business_hours_start: '09:00',
  business_hours_end: '22:00',
  accept_orders: 1,
  max_image_size: 5,
  auto_cancel_minutes: 30
})

const backups = ref([])
const logs = ref([])

const loadSettings = async () => {
  try {
    const res = await api.get('/settings')
    if (res && res.id) {
      Object.assign(form, res)
    }
  } catch (error) {
    console.error(error)
  }
}

const handleSave = async () => {
  try {
    await api.put('/settings', form)
    ElMessage.success('保存成功')
    loadSettings()
  } catch (error) {
    console.error(error)
  }
}

const handleBackup = async () => {
  try {
    await api.post('/settings/backup')
    ElMessage.success('备份成功')
    loadBackups()
  } catch (error) {
    console.error(error)
  }
}

const loadBackups = async () => {
  try {
    const res = await api.get('/settings/backups')
    backups.value = res
  } catch (error) {
    console.error(error)
  }
}

const loadLogs = async () => {
  try {
    const res = await api.get('/settings/logs', {
      params: { pageSize: 10 }
    })
    logs.value = res.list
  } catch (error) {
    console.error(error)
  }
}

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

onMounted(() => {
  loadSettings()
  loadLogs()
})
</script>
