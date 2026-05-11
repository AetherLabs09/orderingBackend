<template>
  <div class="orders">
    <el-card>
      <template #header>
        <span>订单管理</span>
      </template>
      
      <el-form :inline="true" class="search-form">
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待接单" value="pending" />
            <el-option label="制作中" value="preparing" />
            <el-option label="配送中" value="delivering" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="订单号/用户名/手机号" clearable />
        </el-form-item>
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
        <el-form-item>
          <el-button type="primary" @click="loadOrders">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="orders" style="width: 100%">
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column prop="username" label="用户" width="120" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="final_amount" label="金额" width="100">
          <template #default="{ row }">
            ¥{{ row.final_amount }}
          </template>
        </el-table-column>
        <el-table-column prop="delivery_type" label="配送方式" width="100">
          <template #default="{ row }">
            <el-tag>{{ row.delivery_type === 'delivery' ? '配送' : '自提' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">详情</el-button>
            <el-button size="small" type="primary" @click="handleUpdateStatus(row)" v-if="row.status !== 'completed' && row.status !== 'cancelled'">
              操作
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
          @size-change="loadOrders"
          @current-change="loadOrders"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="订单详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ currentOrder.order_no }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentOrder.username }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentOrder.phone }}</el-descriptions-item>
        <el-descriptions-item label="配送方式">{{ currentOrder.delivery_type === 'delivery' ? '配送' : '自提' }}</el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="2">{{ currentOrder.delivery_address }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentOrder.remark || '无' }}</el-descriptions-item>
        <el-descriptions-item label="订单金额">¥{{ currentOrder.total_amount }}</el-descriptions-item>
        <el-descriptions-item label="优惠金额">¥{{ currentOrder.discount_amount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="实付金额">¥{{ currentOrder.final_amount }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType(currentOrder.status)">{{ getStatusText(currentOrder.status) }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      
      <h4 style="margin-top: 20px">订单商品</h4>
      <el-table :data="currentOrder.items" style="width: 100%">
        <el-table-column prop="dish_name" label="菜品名称" />
        <el-table-column prop="price" label="单价" width="100">
          <template #default="{ row }">
            ¥{{ row.price }}
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="subtotal" label="小计" width="100">
          <template #default="{ row }">
            ¥{{ row.subtotal }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="statusDialogVisible" title="订单操作" width="400px">
      <el-form label-width="80px">
        <el-form-item label="订单状态">
          <el-select v-model="newStatus" placeholder="请选择状态">
            <el-option label="待接单" value="pending" />
            <el-option label="制作中" value="preparing" />
            <el-option label="配送中" value="delivering" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmUpdateStatus">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const orders = ref([])
const dialogVisible = ref(false)
const statusDialogVisible = ref(false)
const currentOrder = ref({})
const currentOrderId = ref(null)
const newStatus = ref('')
const dateRange = ref([])

const searchForm = reactive({
  status: '',
  keyword: ''
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

const getStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    preparing: 'info',
    delivering: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return typeMap[status] || ''
}

const loadOrders = async () => {
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    
    const res = await api.get('/orders', { params })
    orders.value = res.list
    pagination.total = res.total
  } catch (error) {
    console.error(error)
  }
}

const handleView = async (row) => {
  try {
    const res = await api.get(`/orders/${row.id}`)
    currentOrder.value = res
    dialogVisible.value = true
  } catch (error) {
    console.error(error)
  }
}

const handleUpdateStatus = (row) => {
  currentOrderId.value = row.id
  newStatus.value = row.status
  statusDialogVisible.value = true
}

const confirmUpdateStatus = async () => {
  try {
    await api.put(`/orders/${currentOrderId.value}/status`, { status: newStatus.value })
    ElMessage.success('状态更新成功')
    statusDialogVisible.value = false
    loadOrders()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  loadOrders()
})
</script>
