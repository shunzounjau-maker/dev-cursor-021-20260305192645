<template>
  <div class="page-container">
    <h2 style="margin-bottom: 20px">仪表盘</h2>
    <template v-if="role === 'admin'">
      <el-row :gutter="20">
        <el-col :span="6" v-for="item in stats" :key="item.label">
          <el-card shadow="hover">
            <div style="display:flex; align-items:center; gap:16px;">
              <el-icon :size="40" :color="item.color"><component :is="item.icon" /></el-icon>
              <div>
                <div style="font-size:28px; font-weight:bold; color:#303133">{{ item.value }}</div>
                <div style="font-size:13px; color:#909399; margin-top:4px">{{ item.label }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-card style="margin-top: 20px">
        <template #header><span>当前学期: {{ data.current_semester }}</span></template>
        <p>系统运行正常。管理员可通过左侧菜单管理教师、学生、课程及开课信息。</p>
      </el-card>
    </template>
    <template v-else>
      <el-card>
        <p>欢迎使用校园管理系统，{{ user?.name }}！请使用左侧菜单进行操作。</p>
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../utils/api'
import { UserFilled, User, Reading, Calendar } from '@element-plus/icons-vue'

const auth = useAuthStore()
const role = computed(() => auth.role)
const user = computed(() => auth.user)

const data = ref({})
const stats = computed(() => [
  { label: '学生总数', value: data.value.student_count || 0, icon: UserFilled, color: '#409eff' },
  { label: '教师总数', value: data.value.teacher_count || 0, icon: User, color: '#67c23a' },
  { label: '课程总数', value: data.value.course_count || 0, icon: Reading, color: '#e6a23c' },
  { label: '本学期开课数', value: data.value.class_count || 0, icon: Calendar, color: '#f56c6c' }
])

onMounted(async () => {
  if (role.value === 'admin') {
    try { data.value = await api.get('/dashboard') } catch {}
  }
})
</script>
