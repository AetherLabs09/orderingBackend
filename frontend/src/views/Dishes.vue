<template>
  <div class="dishes">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>菜品管理</span>
          <el-button type="primary" @click="handleAdd">新增菜品</el-button>
        </div>
      </template>
      
      <el-form :inline="true" class="search-form">
        <el-form-item label="分类">
          <el-select v-model="searchForm.category_id" placeholder="请选择分类" clearable>
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.is_available" placeholder="请选择状态" clearable>
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="菜品名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadDishes">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="dishes" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="菜品名称" />
        <el-table-column prop="category_name" label="分类" width="100" />
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            ¥{{ row.price }}
          </template>
        </el-table-column>
        <el-table-column prop="image" label="图片" width="100">
          <template #default="{ row }">
            <el-image v-if="row.image" :src="row.image" style="width: 50px; height: 50px" fit="cover" />
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column prop="is_available" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_available ? 'success' : 'danger'">
              {{ row.is_available ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_recommended" label="推荐" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.is_recommended" type="warning">推荐</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" @click="handleToggleRecommend(row.id)">
              {{ row.is_recommended ? '取消推荐' : '推荐' }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="菜品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入菜品名称" />
        </el-form-item>
        <el-form-item label="分类" prop="category_id">
          <el-select v-model="form.category_id" placeholder="请选择分类">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="图片" prop="image">
          <el-upload
            class="avatar-uploader"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
          >
            <el-image v-if="form.image" :src="form.image" style="width: 100px; height: 100px" fit="cover" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="规格" prop="specifications">
          <el-input v-model="form.specifications" placeholder="如：大份、小份" />
        </el-form-item>
        <el-form-item label="简介" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入菜品简介" />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="form.stock" :min="0" />
        </el-form-item>
        <el-form-item label="状态" prop="is_available">
          <el-switch v-model="form.is_available" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="推荐" prop="is_recommended">
          <el-switch v-model="form.is_recommended" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import api from '@/utils/api'

const dishes = ref([])
const categories = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增菜品')
const formRef = ref(null)
const editingId = ref(null)

const searchForm = reactive({
  category_id: '',
  is_available: '',
  keyword: ''
})

const form = reactive({
  name: '',
  category_id: '',
  price: 0,
  image: '',
  specifications: '',
  description: '',
  stock: 0,
  is_available: 1,
  is_recommended: 0
})

const rules = {
  name: [{ required: true, message: '请输入菜品名称', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }]
}

const uploadUrl = computed(() => '/api/upload')
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
}))

const loadCategories = async () => {
  try {
    const res = await api.get('/categories')
    categories.value = res
  } catch (error) {
    console.error(error)
  }
}

const loadDishes = async () => {
  try {
    const params = {}
    if (searchForm.category_id) params.category_id = searchForm.category_id
    if (searchForm.is_available !== '') params.is_available = searchForm.is_available
    if (searchForm.keyword) params.keyword = searchForm.keyword
    
    const res = await api.get('/dishes', { params })
    dishes.value = res
  } catch (error) {
    console.error(error)
  }
}

const handleUploadSuccess = (response) => {
  if (response.url) {
    form.image = response.url
    ElMessage.success('图片上传成功')
  }
}

const handleAdd = () => {
  dialogTitle.value = '新增菜品'
  editingId.value = null
  Object.assign(form, {
    name: '',
    category_id: '',
    price: 0,
    image: '',
    specifications: '',
    description: '',
    stock: 0,
    is_available: 1,
    is_recommended: 0
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑菜品'
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    category_id: row.category_id,
    price: row.price,
    image: row.image,
    specifications: row.specifications,
    description: row.description,
    stock: row.stock,
    is_available: row.is_available,
    is_recommended: row.is_recommended
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (editingId.value) {
          await api.put(`/dishes/${editingId.value}`, form)
          ElMessage.success('更新成功')
        } else {
          await api.post('/dishes', form)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        loadDishes()
      } catch (error) {
        console.error(error)
      }
    }
  })
}

const handleToggleRecommend = async (id) => {
  try {
    await api.put(`/dishes/${id}/toggle-recommend`)
    ElMessage.success('操作成功')
    loadDishes()
  } catch (error) {
    console.error(error)
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该菜品吗？', '提示', {
      type: 'warning'
    })
    await api.delete(`/dishes/${id}`)
    ElMessage.success('删除成功')
    loadDishes()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

onMounted(() => {
  loadCategories()
  loadDishes()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
}
</style>
