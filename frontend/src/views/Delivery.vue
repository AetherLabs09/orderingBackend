<template>
  <div class="delivery">
    <el-card>
      <template #header>
        <span>配送/自提设置</span>
      </template>
      
      <el-form :model="form" label-width="120px" style="max-width: 600px">
        <el-form-item label="配送范围">
          <el-input v-model="form.delivery_range" placeholder="如：3公里" />
        </el-form-item>
        <el-form-item label="起送价">
          <el-input-number v-model="form.min_order_amount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="配送费">
          <el-input-number v-model="form.delivery_fee" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="自提点地址">
          <el-input v-model="form.pickup_address" type="textarea" :rows="2" placeholder="请输入自提点地址" />
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
        <el-form-item label="允许预约订餐">
          <el-switch v-model="form.allow_reservation" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSave">保存设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const form = reactive({
  delivery_range: '',
  min_order_amount: 0,
  delivery_fee: 0,
  pickup_address: '',
  business_hours_start: '09:00',
  business_hours_end: '22:00',
  allow_reservation: 1
})

const loadSettings = async () => {
  try {
    const res = await api.get('/delivery')
    if (res && res.id) {
      Object.assign(form, res)
    }
  } catch (error) {
    console.error(error)
  }
}

const handleSave = async () => {
  try {
    await api.post('/delivery', form)
    ElMessage.success('保存成功')
    loadSettings()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  loadSettings()
})
</script>
