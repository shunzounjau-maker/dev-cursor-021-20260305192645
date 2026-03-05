<template>
  <el-container style="height: 100vh">
    <el-aside :width="isCollapse ? '64px' : '220px'" style="transition: width 0.3s; background: #304156;">
      <div class="logo" :class="{ collapsed: isCollapse }">
        <el-icon :size="28" color="#fff"><School /></el-icon>
        <span v-if="!isCollapse">校园管理</span>
      </div>
      <el-menu :default-active="$route.path" :collapse="isCollapse" background-color="#304156" text-color="#bfcbd9" active-text-color="#409eff" router unique-opened>
        <template v-if="role === 'admin'">
          <el-menu-item index="/dashboard"><el-icon><DataAnalysis /></el-icon><span>仪表盘</span></el-menu-item>
          <el-menu-item index="/teachers"><el-icon><User /></el-icon><span>教师管理</span></el-menu-item>
          <el-menu-item index="/students"><el-icon><UserFilled /></el-icon><span>学生管理</span></el-menu-item>
          <el-menu-item index="/courses"><el-icon><Reading /></el-icon><span>课程管理</span></el-menu-item>
          <el-menu-item index="/classes"><el-icon><Calendar /></el-icon><span>开课管理</span></el-menu-item>
        </template>
        <template v-if="role === 'teacher'">
          <el-menu-item index="/my-courses"><el-icon><Reading /></el-icon><span>我的课程</span></el-menu-item>
        </template>
        <template v-if="role === 'student'">
          <el-menu-item index="/enrollment"><el-icon><Select /></el-icon><span>选课中心</span></el-menu-item>
          <el-menu-item index="/timetable"><el-icon><Calendar /></el-icon><span>我的课表</span></el-menu-item>
          <el-menu-item index="/my-grades"><el-icon><Document /></el-icon><span>我的成绩</span></el-menu-item>
        </template>
        <el-menu-item index="/profile"><el-icon><Setting /></el-icon><span>个人信息</span></el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="display:flex; align-items:center; justify-content:space-between; background:#fff; border-bottom:1px solid #e4e7ed; padding: 0 20px;">
        <el-button :icon="isCollapse ? Expand : Fold" text @click="isCollapse = !isCollapse" />
        <div style="display:flex; align-items:center; gap:12px;">
          <el-tag :type="roleTagType">{{ roleLabel }}</el-tag>
          <span style="font-size:14px; color:#606266;">{{ user?.name }}</span>
          <el-button type="danger" text @click="handleLogout">退出</el-button>
        </div>
      </el-header>
      <el-main style="background:#f5f7fa; overflow-y:auto;">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { School, DataAnalysis, User, UserFilled, Reading, Calendar, Select, Document, Setting, Expand, Fold } from '@element-plus/icons-vue'

const router = useRouter()
const auth = useAuthStore()

const isCollapse = ref(false)
const user = computed(() => auth.user)
const role = computed(() => auth.role)

const roleLabel = computed(() => ({ admin: '管理员', teacher: '教师', student: '学生' }[role.value] || ''))
const roleTagType = computed(() => ({ admin: 'danger', teacher: 'success', student: 'warning' }[role.value] || ''))

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.logo.collapsed span {
  display: none;
}
</style>
