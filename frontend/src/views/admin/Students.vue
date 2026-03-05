<template>
  <div class="page-container">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
      <h2>学生管理</h2>
      <el-button type="primary" @click="openDialog()">新增学生</el-button>
    </div>
    <el-table :data="list" stripe border>
      <el-table-column prop="student_no" label="学号" width="100" />
      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column prop="grade" label="年级" width="80" />
      <el-table-column prop="class_name" label="班级" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="username" label="用户名" width="140" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑学生' : '新增学生'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名" v-if="!editing"><el-input v-model="form.username" /></el-form-item>
        <el-form-item label="密码" v-if="!editing"><el-input v-model="form.password" type="password" /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="学号"><el-input v-model="form.student_no" /></el-form-item>
        <el-form-item label="年级"><el-input v-model="form.grade" /></el-form-item>
        <el-form-item label="班级"><el-input v-model="form.class_name" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref([])
const dialogVisible = ref(false)
const editing = ref(null)
const form = ref({})

async function fetchList() {
  list.value = await api.get('/students')
}

function openDialog(row) {
  if (row) {
    editing.value = row.id
    form.value = { name: row.name, student_no: row.student_no, grade: row.grade, class_name: row.class_name, email: row.email }
  } else {
    editing.value = null
    form.value = { username: '', password: 'student123', name: '', student_no: '', grade: '', class_name: '', email: '' }
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  try {
    if (editing.value) {
      await api.put(`/students/${editing.value}`, form.value)
      ElMessage.success('修改成功')
    } else {
      await api.post('/students', form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch {}
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确认删除学生 ${row.name}？`, '提示', { type: 'warning' })
  await api.delete(`/students/${row.id}`)
  ElMessage.success('删除成功')
  fetchList()
}

onMounted(fetchList)
</script>
