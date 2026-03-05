<template>
  <div class="page-container">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
      <h2>课程管理</h2>
      <el-button type="primary" @click="openDialog()">新增课程</el-button>
    </div>
    <el-table :data="list" stripe border>
      <el-table-column prop="code" label="课程代码" width="120" />
      <el-table-column prop="name" label="课程名称" width="180" />
      <el-table-column prop="credits" label="学分" width="80" />
      <el-table-column prop="description" label="描述" show-overflow-tooltip />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑课程' : '新增课程'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="代码"><el-input v-model="form.code" /></el-form-item>
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="学分"><el-input-number v-model="form.credits" :min="1" :max="10" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
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
  list.value = await api.get('/courses')
}

function openDialog(row) {
  if (row) {
    editing.value = row.id
    form.value = { code: row.code, name: row.name, credits: row.credits, description: row.description }
  } else {
    editing.value = null
    form.value = { code: '', name: '', credits: 3, description: '' }
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  try {
    if (editing.value) {
      await api.put(`/courses/${editing.value}`, form.value)
      ElMessage.success('修改成功')
    } else {
      await api.post('/courses', form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch {}
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确认删除课程 ${row.name}？`, '提示', { type: 'warning' })
  await api.delete(`/courses/${row.id}`)
  ElMessage.success('删除成功')
  fetchList()
}

onMounted(fetchList)
</script>
