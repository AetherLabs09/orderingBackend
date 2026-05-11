<template>
  <div class="employees">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>员工与权限管理</span>
          <el-button type="primary" @click="handleAdd">新增员工</el-button>
        </div>
      </template>
      
      <el-form :inline="true" class="search-form">
        <el-form-item label="角色">
          <el-select v-model="searchForm.role" placeholder="请选择角色" clearable>
            <el-option label="管理员" value="admin" />
            <el-option label="运营" value="operator" />
            <el-option label="后厨" value="kitchen" />
            <el-option label="财务" value="finance" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.is_active" placeholder="请选择状态" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadEmployees">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="employees" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag>{{ getRoleText(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_login" label="最后登录" width="180" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="250">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" @click="handleResetPassword(row.id)">重置密码</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)" v-if="row.role !== 'admin'">删除</el-button>
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
          @size-change="loadEmployees"
          @current-change="loadEmployees"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="用户名" prop="username" v-if="!editingId">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!editingId">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="运营" value="operator" />
            <el-option label="后厨" value="kitchen" />
            <el-option label="财务" value="finance" />
          </el-select>
        </el-form-item>
        <el-form-item label="权限" prop="permissions">
          <el-checkbox-group v-model="form.permissionList">
            <el-checkbox label="category">分类管理</el-checkbox>
            <el-checkbox label="dish">菜品管理</el-checkbox>
            <el-checkbox label="user">用户管理</el-checkbox>
            <el-checkbox label="order">订单管理</el-checkbox>
            <el-checkbox label="coupon">优惠券管理</el-checkbox>
            <el-checkbox label="review">评价管理</el-checkbox>
            <el-checkbox label="employee">员工管理</el-checkbox>
            <el-checkbox label="setting">系统设置</el-checkbox>
          </el-checkbox-group>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'

const employees = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增员工')
const formRef = ref(null)
const editingId = ref(null)

const searchForm = reactive({
  role: '',
  is_active: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const form = reactive({
  username: '',
  password: '',
  name: '',
  role: '',
  permissionList: [],
  is_active: 1
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const getRoleText = (role) => {
  const roleMap = {
    admin: '管理员',
    operator: '运营',
    kitchen: '后厨',
    finance: '财务'
  }
  return roleMap[role] || role
}

const loadEmployees = async () => {
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.role) params.role = searchForm.role
    if (searchForm.is_active !== '') params.is_active = searchForm.is_active
    
    const res = await api.get('/employees', { params })
    employees.value = res.list
    pagination.total = res.total
  } catch (error) {
    console.error(error)
  }
}

const handleAdd = () => {
  dialogTitle.value = '新增员工'
  editingId.value = null
  Object.assign(form, {
    username: '',
    password: '',
    name: '',
    role: '',
    permissionList: [],
    is_active: 1
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑员工'
  editingId.value = row.id
  const permissions = row.permissions ? JSON.parse(row.permissions) : []
  Object.assign(form, {
    username: row.username,
    name: row.name,
    role: row.role,
    permissionList: permissions,
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
          name: form.name,
          role: form.role,
          permissions: form.permissionList,
          is_active: form.is_active
        }
        
        if (editingId.value) {
          await api.put(`/employees/${editingId.value}`, data)
          ElMessage.success('更新成功')
        } else {
          data.username = form.username
          data.password = form.password
          await api.post('/employees', data)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        loadEmployees()
      } catch (error) {
        console.error(error)
      }
    }
  })
}

const handleResetPassword = async (id) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入新密码', '重置密码', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^.{6,}$/,
      inputErrorMessage: '密码至少6位'
    })
    
    await api.put(`/employees/${id}/password`, { password: value })
    ElMessage.success('密码重置成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该员工吗？', '提示', {
      type: 'warning'
    })
    await api.delete(`/employees/${id}`)
    ElMessage.success('删除成功')
    loadEmployees()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

onMounted(() => {
  loadEmployees()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
