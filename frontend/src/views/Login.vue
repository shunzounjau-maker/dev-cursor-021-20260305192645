<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="login-header">
        <el-icon :size="48" color="#409eff"><School /></el-icon>
        <h1>校园管理系统</h1>
        <p>Campus Management System</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="0" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" :prefix-icon="Lock" size="large" show-password @keyup.enter="handleLogin" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width:100%" :loading="loading" @click="handleLogin">登 录</el-button>
        </el-form-item>
      </el-form>
      <div class="demo-accounts">
        <el-divider>测试账号</el-divider>
        <el-space wrap>
          <el-tag @click="fillAccount('admin','admin123')" style="cursor:pointer">管理员: admin</el-tag>
          <el-tag type="success" @click="fillAccount('teacher_wang','teacher123')" style="cursor:pointer">教师: teacher_wang</el-tag>
          <el-tag type="warning" @click="fillAccount('student_zhang','student123')" style="cursor:pointer">学生: student_zhang</el-tag>
        </el-space>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import { User, Lock, School } from '@element-plus/icons-vue'

const router = useRouter()
const auth = useAuthStore()

const formRef = ref(null)
const loading = ref(false)
const form = ref({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

function fillAccount(u, p) {
  form.value.username = u
  form.value.password = p
}

async function handleLogin() {
  await formRef.value?.validate()
  loading.value = true
  try {
    await auth.login(form.value.username, form.value.password)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (e) {
    // error handled by interceptor
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrapper {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.login-header {
  text-align: center;
  margin-bottom: 32px;
}
.login-header h1 {
  margin: 12px 0 4px;
  font-size: 24px;
  color: #303133;
}
.login-header p {
  color: #909399;
  font-size: 13px;
}
.demo-accounts {
  margin-top: 8px;
  text-align: center;
}
</style>
