#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================"
echo "  校园管理系统 - Campus Management System"
echo "============================================"

echo ""
echo "[1/4] 安装后端依赖..."
cd "$PROJECT_DIR/backend"
npm install --production 2>&1 | tail -1

echo "[2/4] 安装前端依赖..."
cd "$PROJECT_DIR/frontend"
npm install 2>&1 | tail -1

echo "[3/4] 构建前端..."
npm run build 2>&1 | tail -3

echo "[4/4] 启动后端服务..."
cd "$PROJECT_DIR/backend"
rm -f campus.db
node app.js &
SERVER_PID=$!

sleep 2

if kill -0 $SERVER_PID 2>/dev/null; then
  echo ""
  echo "============================================"
  echo "  系统启动成功!"
  echo "  访问地址: http://localhost:3000"
  echo "  API地址:  http://localhost:3000/api"
  echo ""
  echo "  测试账号:"
  echo "    管理员: admin / admin123"
  echo "    教师:   teacher_wang / teacher123"
  echo "    学生:   student_zhang / student123"
  echo "============================================"
  echo ""
  echo "  按 Ctrl+C 停止服务"
  wait $SERVER_PID
else
  echo "服务启动失败"
  exit 1
fi
