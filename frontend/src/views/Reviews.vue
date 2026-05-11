<template>
  <div class="reviews">
    <el-card>
      <template #header>
        <span>评论评价管理</span>
      </template>
      
      <el-form :inline="true" class="search-form">
        <el-form-item label="评价类型">
          <el-select v-model="searchForm.rating" placeholder="请选择" clearable>
            <el-option label="好评" value="good" />
            <el-option label="差评" value="bad" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.is_hidden" placeholder="请选择状态" clearable>
            <el-option label="显示" :value="0" />
            <el-option label="隐藏" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadReviews">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="reviews" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户" width="120" />
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column prop="dish_name" label="菜品" width="120" />
        <el-table-column prop="rating" label="评分" width="150">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled />
          </template>
        </el-table-column>
        <el-table-column prop="content" label="评价内容" />
        <el-table-column prop="is_hidden" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_hidden ? 'danger' : 'success'">
              {{ row.is_hidden ? '隐藏' : '显示' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="评价时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="handleReply(row)">回复</el-button>
            <el-button size="small" :type="row.is_hidden ? 'success' : 'danger'" @click="handleToggleHide(row)">
              {{ row.is_hidden ? '显示' : '隐藏' }}
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
          @size-change="loadReviews"
          @current-change="loadReviews"
        />
      </div>
    </el-card>

    <el-dialog v-model="replyDialogVisible" title="回复评价" width="500px">
      <el-form label-width="80px">
        <el-form-item label="评价内容">
          <div>{{ currentReview.content }}</div>
        </el-form-item>
        <el-form-item label="回复内容">
          <el-input v-model="replyContent" type="textarea" :rows="4" placeholder="请输入回复内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReply">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const reviews = ref([])
const replyDialogVisible = ref(false)
const currentReview = ref({})
const replyContent = ref('')

const searchForm = reactive({
  rating: '',
  is_hidden: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const loadReviews = async () => {
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.rating) params.rating = searchForm.rating
    if (searchForm.is_hidden !== '') params.is_hidden = searchForm.is_hidden
    
    const res = await api.get('/reviews', { params })
    reviews.value = res.list
    pagination.total = res.total
  } catch (error) {
    console.error(error)
  }
}

const handleReply = (row) => {
  currentReview.value = row
  replyContent.value = row.reply || ''
  replyDialogVisible.value = true
}

const submitReply = async () => {
  try {
    await api.put(`/reviews/${currentReview.value.id}/reply`, { reply: replyContent.value })
    ElMessage.success('回复成功')
    replyDialogVisible.value = false
    loadReviews()
  } catch (error) {
    console.error(error)
  }
}

const handleToggleHide = async (row) => {
  try {
    await api.put(`/reviews/${row.id}/hide`, { is_hidden: row.is_hidden ? 0 : 1 })
    ElMessage.success('操作成功')
    loadReviews()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  loadReviews()
})
</script>
