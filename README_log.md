# 校园管理系统 - 开发过程记录

## 1. 环境与版本信息

### 操作系统与运行环境
- **OS**: Linux 6.12.72-linuxkit (容器环境)
- **Node.js**: v20.20.0
- **Python**: 3.12.3
- **npm**: 随 Node.js 20 安装

### 关键依赖版本

**后端 (Node.js + Express)**
| 依赖 | 版本 | 说明 |
|------|------|------|
| express | ^4.x | Web 框架 |
| better-sqlite3 | ^11.x | SQLite3 数据库驱动 |
| jsonwebtoken | ^9.x | JWT 认证 |
| bcryptjs | ^2.x | 密码加盐哈希 |
| cors | ^2.x | 跨域支持 |
| express-validator | ^7.x | 输入校验 |

**前端 (Vue 3 + Element Plus)**
| 依赖 | 版本 | 说明 |
|------|------|------|
| vue | ^3.x | 前端框架 |
| element-plus | ^2.x | UI 组件库 |
| vue-router | ^4.x | 路由管理 |
| pinia | ^2.x | 状态管理 |
| axios | ^1.x | HTTP 客户端 |
| vite | ^7.x | 构建工具 |

### 数据库配置
- **数据库**: SQLite3 (文件: `backend/campus.db`)
- **初始化方式**: 应用启动时自动执行建表 DDL + 种子数据导入
- **种子数据来源**: `/workspace/data/021/seed/` 目录下的 JSON 文件
- **WAL模式**: 已启用 (提升并发读写性能)
- **外键约束**: 已启用

## 2. 启动与部署过程

### 一键启动
```bash
cd /workspace/problem_021
./start.sh
```

### 分步启动
```bash
# 1. 安装后端依赖
cd backend && npm install

# 2. 安装前端依赖并构建
cd ../frontend && npm install && npm run build

# 3. 启动后端 (同时提供前端静态文件服务)
cd ../backend && node app.js
```

### 访问地址
- **Web 界面**: http://localhost:3000
- **API 接口**: http://localhost:3000/api

### 测试账号
| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 教师 | teacher_wang | teacher123 |
| 教师 | teacher_li | teacher123 |
| 学生 | student_zhang | student123 |
| 学生 | student_liu | student123 |
| 学生 | student_chen | student123 |

## 3. 测试过程与结果

### 3.1 冒烟测试结果

执行了 `/workspace/data/021/tests/smoke_test.sh`，结果如下：

| 步骤 | 描述 | 结果 |
|------|------|------|
| Step 1 | 管理员登录 | ✅ PASS |
| Step 2 | 创建教师 | ✅ PASS |
| Step 3 | 创建学生 | ✅ PASS |
| Step 4 | 创建课程 | ✅ PASS |
| Step 5 | 创建开课记录 | ✅ PASS |
| Step 6 | 学生选课 | ✅ PASS |
| Step 7 | 教师录入成绩 | ✅ PASS |
| Step 8 | 学生查看课表 | ✅ PASS |
| Step 9 | 学生查看成绩 | ✅ PASS |

**总计: 9 / 9 PASS — ALL PASSED!**

### 3.2 手动验收测试

#### 权限控制测试
- 学生访问管理员接口 (POST /api/teachers): 返回 `{"error":"权限不足"}` (403) ✅
- 无 Token 访问受保护接口: 返回 `{"error":"未提供认证令牌"}` (401) ✅
- 错误密码登录: 返回 `{"error":"用户名或密码错误"}` (401) ✅

#### API 响应示例

**登录响应:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiI...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "name": "系统管理员",
    "email": "admin@campus.edu"
  }
}
```

**仪表盘统计:**
```json
{
  "student_count": 3,
  "teacher_count": 2,
  "course_count": 5,
  "class_count": 5,
  "enrollment_count": 0,
  "current_semester": "2024-2025-2"
}
```

**选课响应:**
```json
{
  "id": 1,
  "class_id": 6,
  "student_id": 4,
  "message": "选课成功"
}
```

## 4. 界面与交互可视化

由于在容器环境中无法生成浏览器截图，已提供 HTML 预览文件：

| 页面 | 文件路径 |
|------|----------|
| 登录页 | `docs/previews/login.html` |
| 管理员 Dashboard | `docs/previews/admin-dashboard.html` |

### 前端主要组件结构

```
src/
├── main.js              # 入口文件
├── App.vue              # 根组件
├── router/index.js      # 路由配置
├── stores/auth.js       # Pinia 认证状态管理
├── utils/api.js         # Axios 封装 + 拦截器
└── views/
    ├── Login.vue         # 登录页
    ├── Layout.vue        # 主布局 (侧边栏 + 顶栏)
    ├── Dashboard.vue     # 仪表盘
    ├── Profile.vue       # 个人信息
    ├── admin/
    │   ├── Teachers.vue  # 教师 CRUD
    │   ├── Students.vue  # 学生 CRUD
    │   ├── Courses.vue   # 课程 CRUD
    │   └── Classes.vue   # 开课 CRUD
    ├── teacher/
    │   ├── MyCourses.vue # 我的课程列表
    │   └── GradeEntry.vue# 成绩录入/修改
    └── student/
        ├── Enrollment.vue# 选课/退课
        ├── Timetable.vue # 我的课表
        └── MyGrades.vue  # 我的成绩
```

## 5. 系统架构说明

### 后端架构
```
backend/
├── app.js            # Express 应用入口
├── db.js             # SQLite 数据库初始化 + 种子数据
├── middleware/
│   └── auth.js       # JWT 认证 + 角色授权中间件
└── routes/
    ├── auth.js       # 登录认证
    ├── teachers.js   # 教师 CRUD (管理员)
    ├── students.js   # 学生 CRUD (管理员)
    ├── courses.js    # 课程 CRUD (管理员)
    ├── classes.js    # 开课 CRUD (管理员)
    ├── enrollments.js# 选课/退课 (学生)
    ├── grades.js     # 成绩录入/查看
    ├── timetable.js  # 课表查看
    ├── dashboard.js  # 统计仪表盘 (管理员)
    └── profile.js    # 个人信息
```

### 数据模型
```
User        (id, username, password_hash, role, name, email, created_at)
Teacher     (id, user_id→User, staff_no, department)
Student     (id, user_id→User, student_no, grade, class_name)
Course      (id, code, name, credits, description)
Class       (id, course_id→Course, teacher_id→Teacher, semester, schedule, capacity)
Enrollment  (id, class_id→Class, student_id→Student, enrolled_at) UNIQUE(class_id,student_id)
Grade       (id, enrollment_id→Enrollment, score, updated_at)
```

### 安全措施
- 密码使用 bcrypt 加盐哈希存储 (cost=10)
- JWT Token 认证 (24小时过期)
- 角色鉴权中间件 (admin/teacher/student)
- 选课唯一约束 (UNIQUE(class_id, student_id)) 防止重复选课
- 学分上限检查 (30学分/学期)
- 容量检查 (选课人数不超过课程容量)
- 成绩录入前不可退课

## 6. 总结与后续改进方向

### 完成度
- [x] 后端 RESTful API (全部功能)
- [x] 用户认证与角色鉴权 (JWT + RBAC)
- [x] 管理员 CRUD (教师/学生/课程/开课/Dashboard)
- [x] 教师功能 (查看课程/学生名单/成绩录入修改)
- [x] 学生功能 (选课/退课/课表/成绩)
- [x] 前端 SPA (Vue 3 + Element Plus)
- [x] 种子数据导入
- [x] 冒烟测试 9/9 全部通过
- [x] 权限控制 (403 拦截)
- [x] 数据持久化 (SQLite)
- [x] 一键启动脚本

### 已知限制
- 前端在容器环境中无法直接浏览器访问 (需端口转发)
- 未实现完整的审计日志
- 未实现多学期切换的 UI
- 未实现容器化部署 (Dockerfile)

### 改进方向
1. **性能优化**: 添加 Redis 缓存层、分页查询、数据库索引优化
2. **安全增强**: 添加请求频率限制、CSRF 防护、输入消毒
3. **功能扩展**: 多学期支持、多学院统计、审计日志、导入导出
4. **DevOps**: Docker 容器化、CI/CD 管道、日志聚合
5. **UX 改进**: 响应式移动端适配、更丰富的数据可视化图表
