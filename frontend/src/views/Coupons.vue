<template>
  <div class="coupons">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>优惠券管理</span>
          <el-button type="primary" @click="handleAdd">新增优惠券</el-button>
        </div>
      </template>
      
      <el-form :inline="true" class="search-form">
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="请选择类型" clearable>
            <el-option label="满减券" value="discount_amount" />
            <el-option label="折扣券" value="discount_rate" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.is_active" placeholder="请选择状态" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadCoupons">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="coupons" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="优惠券名称" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag>{{ row.type === 'discount_amount' ? '满减券' : '折扣券' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="discount_amount" label="优惠金额" width="100">
          <template #default="{ row }">
            {{ row.discount_amount ? `¥${row.discount_amount}` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="discount_rate" label="折扣率" width="100">
          <template #default="{ row }">
            {{ row.discount_rate ? `${row.discount_rate}%` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="min_order_amount" label="使用门槛" width="100">
          <template #default="{ row }">
            ¥{{ row.min_order_amount }}
          </template>
        </el-table-column>
        <el-table-column prop="used_quantity" label="已使用/总数" width="120">
          <template #default="{ row }">
            {{ row.used_quantity }} / {{ row.total_quantity }}
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="handleViewRecords(row.id)">记录</el-button>
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadCoupons"
          @current-change="loadCoupons"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="优惠券名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入优惠券名称" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型">
            <el-option label="满减券" value="discount_amount" />
            <el-option label="折扣券" value="discount_rate" />
          </el-select>
        </el-form-item>
        <el-form-item label="优惠金额" prop="discount_amount" v-if="form.type === 'discount_amount'">
          <el-input-number v-model="form.discount_amount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="折扣率" prop="discount_rate" v-if="form.type === 'discount_rate'">
          <el-input-number v-model="form.discount_rate" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="使用门槛" prop="min_order_amount">
          <el-input-number v-model="form.min_order_amount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="发放数量" prop="total_quantity">
          <el-input-number v-model="form.total_quantity" :min="0" />
        </el-form-item>
        <el-form-item label="有效期" prop="dateRange">
          <el-date-picker
            v-model="form.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="状态" prop="is_active">
          <el-switch v-model="form.is_active" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="recordsDialogVisible" title="优惠券记录" width="700px">
      <el-table :data="records" style="width: 100%">
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="is_used" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_used ? 'success' : 'info'">
              {{ row.is_used ? '已使用' : '未使用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="领取时间" width="180" />
        <el-table-column prop="used_at" label="使用时间" width="180" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'

const coupons = ref([])
const records = ref([])
const dialogVisible = ref(false)
const recordsDialogVisible = ref(false)
const dialogTitle = ref('新增优惠券')
const formRef = ref(null)
const editingId = ref(null)

const searchForm = reactive({
  type: '',
  is_active: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const form = reactive({
  name: '',
  type: 'discount_amount',
  discount_amount: 0,
  discount_rate: 0,
  min_order_amount: 0,
  total_quantity: 0,
  dateRange: [],
  is_active: 1
})

const rules = {
  name: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
}

const loadCoupons = async () => {
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.type) params.type = searchForm.type
    if (searchForm.is_active !== '') params.is_active = searchForm.is_active
    
    const res = await api.get('/coupons', { params })
    coupons.value = res.list
    pagination.total = res.total
  } catch (error) {
    console.error(error)
  }
}

const handleAdd = () => {
  dialogTitle.value = '新增优惠券'
  editingId.value = null
  Object.assign(form, {
    name: '',
    type: 'discount_amount',
    discount_amount: 0,
    discount_rate: 0,
    min_order_amount: 0,
    total_quantity: 0,
    dateRange: [],
    is_active: 1
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑优惠券'
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    type: row.type,
    discount_amount: row.discount_amount,
    discount_rate: row.discount_rate,
    min_order_amount: row.min_order_amount,
    total_quantity: row.total_quantity,
    dateRange: [row.start_date, row.end_date],
    is_active: row.is_active
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const data = {
          ...form,
          start_date: form.dateRange[0],
          end_date: form.dateRange[1]
        }
        
        if (editingId.value) {
          await api.put(`/coupons/${editingId.value}`, data)
          ElMessage.success('更新成功')
        } else {
          await api.post('/coupons', data)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        loadCoupons()
      } catch (error) {
        console.error(error)
      }
    }
  })
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该优惠券吗？', '提示', {
      type: 'warning'
    })
    await api.delete(`/coupons/${id}`)
    ElMessage.success('删除成功')
    loadCoupons()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

const handleViewRecords = async (id) => {
  try {
    const res = await api.get(`/coupons/${id}/records`)
    records.value = res.list
    recordsDialogVisible.value = true
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  loadCoupons()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
