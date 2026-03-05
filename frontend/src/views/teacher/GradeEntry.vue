<template>
  <div class="page-container">
    <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px">
      <el-button @click="$router.back()">返回</el-button>
      <h2>成绩录入</h2>
    </div>
    <el-table :data="students" stripe border>
      <el-table-column prop="student_no" label="学号" width="120" />
      <el-table-column prop="student_name" label="姓名" width="120" />
      <el-table-column label="成绩" width="200">
        <template #default="{ row }">
          <el-input-number v-model="row.score" :min="0" :max="100" :precision="0" size="small" style="width:140px" />
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.id ? 'success' : 'info'" size="small">{{ row.id ? '已录入' : '未录入' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="saveGrade(row)">{{ row.id ? '修改' : '录入' }}</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../utils/api'
import { ElMessage } from 'element-plus'

const route = useRoute()
const classId = route.params.classId
const students = ref([])

onMounted(async () => {
  students.value = await api.get('/grades', { params: { class_id: classId } })
})

async function saveGrade(row) {
  if (row.score == null) {
    return ElMessage.warning('请输入成绩')
  }
  try {
    if (row.id) {
      await api.put(`/grades/${row.id}`, { score: row.score })
      ElMessage.success('成绩修改成功')
    } else {
      const res = await api.post('/grades', { enrollment_id: row.enrollment_id, score: row.score })
      row.id = res.id
      ElMessage.success('成绩录入成功')
    }
  } catch {}
}
</script>
