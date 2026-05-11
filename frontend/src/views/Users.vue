<template>
  <div class="users">
    <el-card>
      <template #header>
        <span>用户管理</span>
      </template>
      
      <el-form :inline="true" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="用户名/手机号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.is_disabled" placeholder="请选择状态" clearable>
            <el-option label="正常" :value="0" />
            <el-option label="禁用" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadUsers">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="users" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="total_consumption" label="消费金额" width="120">
          <template #default="{ row }">
            ¥{{ row.total_consumption || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="is_disabled" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_disabled ? 'danger' : 'success'">
              {{ row.is_disabled ? '禁用' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="registered_at" label="注册时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button size="small" :type="row.is_disabled ? 'success' : 'danger'" @click="handleToggleDisable(row)">
              {{ row.is_disabled ? '启用' : '禁用' }}
            </el-button>
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
          @size-change="loadUsers"
          @current-change="loadUsers"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="用户详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentUser.phone }}</el-descriptions-item>
        <el-descriptions-item label="消费金额">¥{{ currentUser.total_consumption || 0 }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ currentUser.registered_at }}</el-descriptions-item>
      </el-descriptions>
      
      <h4 style="margin-top: 20px">最近订单</h4>
      <el-table :data="currentUser.recentOrders" style="width: 100%">
        <el-table-column prop="order_no" label="订单号" />
        <el-table-column prop="final_amount" label="金额" width="100">
          <template #default="{ row }">
            ¥{{ row.final_amount }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag>{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" width="180" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'

const users = ref([])
const dialogVisible = ref(false)
const currentUser = ref({})

const searchForm = reactive({
  keyword: '',
  is_disabled: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const getStatusText = (status) => {
  const statusMap = {
    pending: '待接单',
    preparing: '制作中',
    delivering: '配送中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

const loadUsers = async () => {
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.is_disabled !== '') params.is_disabled = searchForm.is_disabled
    
    const res = await api.get('/users', { params })
    users.value = res.list
    pagination.total = res.total
  } catch (error) {
    console.error(error)
  }
}

const handleView = async (row) => {
  try {
    const res = await api.get(`/users/${row.id}`)
    currentUser.value = res
    dialogVisible.value = true
  } catch (error) {
    console.error(error)
  }
}

const handleToggleDisable = async (row) => {
  try {
    const action = row.is_disabled ? '启用' : '禁用'
    await ElMessageBox.confirm(`确定要${action}该用户吗？`, '提示', {
      type: 'warning'
    })
    await api.put(`/users/${row.id}/disable`, { is_disabled: row.is_disabled ? 0 : 1 })
    ElMessage.success(`${action}成功`)
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

onMounted(() => {
  loadUsers()
})
</script>
