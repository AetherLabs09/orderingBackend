# 订餐后台管理系统

基于 Vue3 + Element Plus + Node.js + SQLite 的订餐后台管理系统

## 快速开始

### 默认管理员账号
- 用户名：`admin`
- 密码：`123456`

### Docker部署（推荐）

1. **构建镜像**
   ```bash
   # Windows: 双击运行 docker-build.bat
   # 或手动执行：
   docker build -t restaurant-admin:latest .
   ```

2. **运行容器**
   ```bash
   # Windows: 双击运行 docker-run.bat
   # 或手动执行：
   docker run -d -p 3000:3000 --name restaurant-admin restaurant-admin:latest
   ```

3. **访问系统**
   - 地址：http://localhost:3000
   - 账号：admin / 123456

4. **重置数据**（如需重新初始化）
   ```bash
   # Windows: 双击运行 docker-reset.bat
   # 或手动执行：
   docker stop restaurant-admin
   docker rm restaurant-admin
   docker rmi restaurant-admin:latest
   # 然后重新构建和运行
   ```

## 功能模块

- 菜品分类管理：新增、编辑、删除、排序菜品分类
- 菜品信息管理：添加菜品、价格、图片、规格、库存管理
- 用户管理：查看用户信息、消费记录、禁用用户
- 订单管理：订单状态管理、订单详情查看
- 配送/自提设置：配置配送范围、费用、营业时间
- 优惠券活动管理：创建和管理优惠券
- 评论评价管理：查看和回复用户评价
- 营收数据统计：销售数据统计和报表导出
- 员工与权限管理：员工账号管理和权限分配
- 系统基础配置：店铺设置、数据备份、操作日志

## 技术栈

### 前端
- Vue 3
- Element Plus
- Vue Router
- Pinia
- Axios
- ECharts

### 后端
- Node.js
- Express
- better-sqlite3
- JWT认证

## 项目结构

```
repo/
├── backend/           # 后端项目
│   ├── db/           # 数据库文件
│   ├── middleware/   # 中间件
│   ├── routes/       # 路由
│   ├── uploads/      # 上传文件
│   └── app.js        # 应用入口
├── frontend/         # 前端项目
│   ├── src/
│   │   ├── views/   # 页面组件
│   │   ├── router/  # 路由配置
│   │   ├── stores/  # 状态管理
│   │   └── utils/   # 工具函数
│   └── vite.config.js
└── README.md
```

## 本地开发

### 后端启动

```bash
cd repo/backend
npm install
npm start
```

后端服务运行在 http://localhost:3000

### 前端启动

```bash
cd repo/frontend
npm install
npm run dev
```

前端服务运行在 http://localhost:5173

## Docker部署

### 构建镜像

```bash
docker build -t restaurant-admin .
```

### 运行容器

```bash
docker run -d -p 3000:3000 --name restaurant-admin restaurant-admin
```

访问 http://localhost:3000

### 默认管理员账号

- 用户名：admin
- 密码：123456

## 数据库

系统使用 SQLite 数据库，数据库文件位于 `/app/db/database.sqlite`

首次运行时会自动初始化数据库表结构和默认数据。

## API接口

系统提供完整的RESTful API接口：

- `/api/auth` - 认证相关
- `/api/categories` - 分类管理
- `/api/dishes` - 菜品管理
- `/api/users` - 用户管理
- `/api/orders` - 订单管理
- `/api/delivery` - 配送设置
- `/api/coupons` - 优惠券管理
- `/api/reviews` - 评价管理
- `/api/statistics` - 数据统计
- `/api/employees` - 员工管理
- `/api/settings` - 系统设置
- `/api/upload` - 文件上传
