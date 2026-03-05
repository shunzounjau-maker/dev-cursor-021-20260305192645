<template>
  <div class="page-container">
    <h2 style="margin-bottom:16px">我的成绩</h2>
    <el-table :data="grades" stripe border>
      <el-table-column prop="course_name" label="课程名称" />
      <el-table-column prop="course_code" label="课程代码" width="120" />
      <el-table-column prop="credits" label="学分" width="80" />
      <el-table-column prop="score" label="成绩" width="80">
        <template #default="{ row }">
          <el-tag :type="row.score >= 60 ? 'success' : 'danger'">{{ row.score }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="teacher_name" label="教师" width="120" />
      <el-table-column prop="semester" label="学期" width="120" />
    </el-table>
    <el-card style="margin-top:16px" v-if="grades.length > 0">
      <div style="display:flex; gap:40px;">
        <div><strong>总学分：</strong>{{ totalCredits }}</div>
        <div><strong>平均分：</strong>{{ avgScore }}</div>
        <div><strong>GPA：</strong>{{ gpa }}</div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../utils/api'

const grades = ref([])

const totalCredits = computed(() => grades.value.reduce((s, g) => s + (g.credits || 0), 0))
const avgScore = computed(() => {
  if (!grades.value.length) return 0
  return (grades.value.reduce((s, g) => s + g.score, 0) / grades.value.length).toFixed(1)
})
const gpa = computed(() => {
  if (!grades.value.length) return '0.00'
  let totalPoints = 0, totalCr = 0
  for (const g of grades.value) {
    const cr = g.credits || 0
    let point = 0
    if (g.score >= 90) point = 4.0
    else if (g.score >= 85) point = 3.7
    else if (g.score >= 82) point = 3.3
    else if (g.score >= 78) point = 3.0
    else if (g.score >= 75) point = 2.7
    else if (g.score >= 72) point = 2.3
    else if (g.score >= 68) point = 2.0
    else if (g.score >= 64) point = 1.5
    else if (g.score >= 60) point = 1.0
    totalPoints += point * cr
    totalCr += cr
  }
  return totalCr ? (totalPoints / totalCr).toFixed(2) : '0.00'
})

onMounted(async () => {
  grades.value = await api.get('/grades')
})
</script>
