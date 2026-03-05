<template>
  <div class="page-container">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
      <h2>开课管理</h2>
      <el-button type="primary" @click="openDialog()">新增开课</el-button>
    </div>
    <el-table :data="list" stripe border>
      <el-table-column prop="course_name" label="课程" width="160" />
      <el-table-column prop="course_code" label="课程代码" width="100" />
      <el-table-column prop="teacher_name" label="授课教师" width="120" />
      <el-table-column prop="semester" label="学期" width="120" />
      <el-table-column prop="schedule" label="上课时间" />
      <el-table-column prop="capacity" label="容量" width="80" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑开课' : '新增开课'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="课程">
          <el-select v-model="form.course_id" placeholder="选择课程" style="width:100%">
            <el-option v-for="c in courses" :key="c.id" :label="`${c.code} - ${c.name}`" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="教师">
          <el-select v-model="form.teacher_id" placeholder="选择教师" style="width:100%">
            <el-option v-for="t in teachers" :key="t.id" :label="`${t.staff_no} - ${t.name}`" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="学期"><el-input v-model="form.semester" placeholder="如 2024-2025-2" /></el-form-item>
        <el-form-item label="时间"><el-input v-model="form.schedule" placeholder="如 周一 1-2节" /></el-form-item>
        <el-form-item label="容量"><el-input-number v-model="form.capacity" :min="1" :max="500" /></el-form-item>
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
const courses = ref([])
const teachers = ref([])
const dialogVisible = ref(false)
const editing = ref(null)
const form = ref({})

async function fetchData() {
  const [cls, crs, tch] = await Promise.all([
    api.get('/classes'),
    api.get('/courses'),
    api.get('/teachers')
  ])
  list.value = cls
  courses.value = crs
  teachers.value = tch
}

function openDialog(row) {
  if (row) {
    editing.value = row.id
    form.value = { course_id: row.course_id, teacher_id: row.teacher_id, semester: row.semester, schedule: row.schedule, capacity: row.capacity }
  } else {
    editing.value = null
    form.value = { course_id: '', teacher_id: '', semester: '2024-2025-2', schedule: '', capacity: 30 }
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  try {
    if (editing.value) {
      await api.put(`/classes/${editing.value}`, form.value)
      ElMessage.success('修改成功')
    } else {
      await api.post('/classes', form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch {}
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确认删除该开课记录？`, '提示', { type: 'warning' })
  await api.delete(`/classes/${row.id}`)
  ElMessage.success('删除成功')
  fetchData()
}

onMounted(fetchData)
</script>
