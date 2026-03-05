<template>
  <div class="page-container">
    <h2 style="margin-bottom:16px">我的课表</h2>
    <el-table :data="timetable" stripe border>
      <el-table-column prop="course_name" label="课程名称" />
      <el-table-column prop="course_code" label="课程代码" width="120" />
      <el-table-column prop="credits" label="学分" width="80" />
      <el-table-column prop="teacher_name" label="授课教师" width="120" />
      <el-table-column prop="schedule" label="上课时间" />
      <el-table-column prop="semester" label="学期" width="120" />
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../utils/api'

const timetable = ref([])

onMounted(async () => {
  timetable.value = await api.get('/timetable')
})
</script>
