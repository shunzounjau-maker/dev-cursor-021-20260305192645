<template>
  <div class="page-container">
    <h2 style="margin-bottom:16px">我的课程</h2>
    <el-table :data="list" stripe border>
      <el-table-column prop="course_name" label="课程" width="180" />
      <el-table-column prop="course_code" label="课程代码" width="120" />
      <el-table-column prop="credits" label="学分" width="80" />
      <el-table-column prop="semester" label="学期" width="120" />
      <el-table-column prop="schedule" label="上课时间" />
      <el-table-column prop="capacity" label="容量" width="80" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="goGradeEntry(row)">成绩录入</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../utils/api'

const router = useRouter()
const list = ref([])

onMounted(async () => {
  list.value = await api.get('/timetable')
})

function goGradeEntry(row) {
  router.push(`/grade-entry/${row.class_id}`)
}
</script>
