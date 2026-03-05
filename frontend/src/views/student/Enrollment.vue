<template>
  <div class="page-container">
    <h2 style="margin-bottom:16px">选课中心</h2>

    <el-card style="margin-bottom:20px">
      <template #header><span>已选课程</span></template>
      <el-table :data="myEnrollments" stripe size="small">
        <el-table-column prop="course_name" label="课程" />
        <el-table-column prop="course_code" label="代码" width="100" />
        <el-table-column prop="credits" label="学分" width="60" />
        <el-table-column prop="schedule" label="时间" />
        <el-table-column prop="teacher_name" label="教师" width="100" />
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="dropCourse(row)">退课</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card>
      <template #header><span>可选课程</span></template>
      <el-table :data="availableClasses" stripe size="small">
        <el-table-column prop="course_name" label="课程" />
        <el-table-column prop="course_code" label="代码" width="100" />
        <el-table-column prop="credits" label="学分" width="60" />
        <el-table-column prop="teacher_name" label="教师" width="100" />
        <el-table-column prop="semester" label="学期" width="110" />
        <el-table-column prop="schedule" label="时间" />
        <el-table-column prop="capacity" label="容量" width="60" />
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button size="small" type="success" @click="enroll(row)" :disabled="isEnrolled(row.id)">
              {{ isEnrolled(row.id) ? '已选' : '选课' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const availableClasses = ref([])
const myEnrollments = ref([])

async function fetchData() {
  const [classes, enrollments] = await Promise.all([
    api.get('/classes'),
    api.get('/enrollments')
  ])
  availableClasses.value = classes
  myEnrollments.value = enrollments
}

function isEnrolled(classId) {
  return myEnrollments.value.some(e => e.class_id === classId)
}

async function enroll(row) {
  try {
    await api.post('/enrollments', { class_id: row.id })
    ElMessage.success('选课成功')
    fetchData()
  } catch {}
}

async function dropCourse(row) {
  await ElMessageBox.confirm('确认退课？', '提示', { type: 'warning' })
  try {
    await api.delete(`/enrollments/${row.id}`)
    ElMessage.success('退课成功')
    fetchData()
  } catch {}
}

onMounted(fetchData)
</script>
