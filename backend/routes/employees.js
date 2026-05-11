const express = require('express');
const router = express.Router();
const db = require('../db/database');
const bcrypt = require('bcryptjs');
const { auth, checkPermission } = require('../middleware/auth');

router.get('/', auth, checkPermission('employee'), (req, res) => {
  const { role, is_active, page = 1, pageSize = 20 } = req.query;
  
  let sql = 'SELECT id, username, name, role, permissions, is_active, last_login, created_at FROM employees WHERE 1=1';
  const params = [];
  
  if (role) {
    sql += ' AND role = ?';
    params.push(role);
  }
  
  if (is_active !== undefined) {
    sql += ' AND is_active = ?';
    params.push(is_active);
  }
  
  const countSql = sql.replace('SELECT id, username, name, role, permissions, is_active, last_login, created_at', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const employees = db.prepare(sql).all(...params);
  
  res.json({ list: employees, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', auth, (req, res) => {
  const { id } = req.params;
  const employee = db.prepare('SELECT id, username, name, role, permissions, is_active, last_login, created_at FROM employees WHERE id = ?').get(id);
  
  if (!employee) {
    return res.status(404).json({ message: '员工不存在' });
  }
  
  res.json(employee);
});

router.post('/', auth, checkPermission('employee'), (req, res) => {
  const { username, password, name, role, permissions } = req.body;
  
  const existing = db.prepare('SELECT * FROM employees WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ message: '用户名已存在' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const result = db.prepare(`
    INSERT INTO employees (username, password, name, role, permissions)
    VALUES (?, ?, ?, ?, ?)
  `).run(username, hashedPassword, name, role, JSON.stringify(permissions));
  
  res.json({ id: result.lastInsertRowid, message: '员工创建成功' });
});

router.put('/:id', auth, checkPermission('employee'), (req, res) => {
  const { id } = req.params;
  const { name, role, permissions, is_active } = req.body;
  
  db.prepare(`
    UPDATE employees 
    SET name = ?, role = ?, permissions = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, role, JSON.stringify(permissions), is_active, id);
  
  res.json({ message: '员工信息更新成功' });
});

router.put('/:id/password', auth, checkPermission('employee'), (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE employees SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hashedPassword, id);
  
  res.json({ message: '密码重置成功' });
});

router.delete('/:id', auth, checkPermission('employee'), (req, res) => {
  const { id } = req.params;
  
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
  if (!employee) {
    return res.status(404).json({ message: '员工不存在' });
  }
  
  if (employee.role === 'admin') {
    return res.status(400).json({ message: '无法删除管理员账号' });
  }
  
  db.prepare('DELETE FROM employees WHERE id = ?').run(id);
  
  res.json({ message: '员工删除成功' });
});

router.put('/:id/toggle', auth, checkPermission('employee'), (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
  if (!employee) {
    return res.status(404).json({ message: '员工不存在' });
  }
  
  if (employee.role === 'admin') {
    return res.status(400).json({ message: '无法禁用管理员账号' });
  }
  
  db.prepare('UPDATE employees SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(is_active, id);
  
  res.json({ message: is_active ? '员工已启用' : '员工已禁用' });
});

module.exports = router;
