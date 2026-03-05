<template>
  <div class="page-container">
    <h2 style="margin-bottom:16px">个人信息</h2>
    <el-card style="max-width:600px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名"><el-input :value="profile.username" disabled /></el-form-item>
        <el-form-item label="角色"><el-tag>{{ roleMap[profile.role] }}</el-tag></el-form-item>
        <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
        <el-form-item v-if="profile.staff_no" label="工号"><el-input :value="profile.staff_no" disabled /></el-form-item>
        <el-form-item v-if="profile.department" label="院系"><el-input :value="profile.department" disabled /></el-form-item>
        <el-form-item v-if="profile.student_no" label="学号"><el-input :value="profile.student_no" disabled /></el-form-item>
        <el-form-item v-if="profile.grade" label="年级"><el-input :value="profile.grade" disabled /></el-form-item>
        <el-form-item v-if="profile.class_name" label="班级"><el-input :value="profile.class_name" disabled /></el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSave">保存修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../utils/api'
import { ElMessage } from 'element-plus'

const roleMap = { admin: '管理员', teacher: '教师', student: '学生' }
const profile = ref({})
const form = ref({ name: '', email: '' })

onMounted(async () => {
  profile.value = await api.get('/profile')
  form.value = { name: profile.value.name, email: profile.value.email }
})

async function handleSave() {
  await api.put('/profile', form.value)
  ElMessage.success('修改成功')
  profile.value = await api.get('/profile')
}
</script>
