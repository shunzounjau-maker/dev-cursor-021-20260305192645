import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
      { path: 'teachers', name: 'Teachers', component: () => import('../views/admin/Teachers.vue'), meta: { role: 'admin' } },
      { path: 'students', name: 'Students', component: () => import('../views/admin/Students.vue'), meta: { role: 'admin' } },
      { path: 'courses', name: 'Courses', component: () => import('../views/admin/Courses.vue'), meta: { role: 'admin' } },
      { path: 'classes', name: 'Classes', component: () => import('../views/admin/Classes.vue'), meta: { role: 'admin' } },
      { path: 'my-courses', name: 'MyCourses', component: () => import('../views/teacher/MyCourses.vue'), meta: { role: 'teacher' } },
      { path: 'grade-entry/:classId', name: 'GradeEntry', component: () => import('../views/teacher/GradeEntry.vue'), meta: { role: 'teacher' } },
      { path: 'enrollment', name: 'Enrollment', component: () => import('../views/student/Enrollment.vue'), meta: { role: 'student' } },
      { path: 'timetable', name: 'Timetable', component: () => import('../views/student/Timetable.vue'), meta: { role: 'student' } },
      { path: 'my-grades', name: 'MyGrades', component: () => import('../views/student/MyGrades.vue'), meta: { role: 'student' } },
      { path: 'profile', name: 'Profile', component: () => import('../views/Profile.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    return next('/login')
  }
  if (to.path === '/login' && token) {
    return next('/')
  }
  next()
})

export default router
