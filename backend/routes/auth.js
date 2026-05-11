const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { SECRET_KEY } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const employee = db.prepare('SELECT * FROM employees WHERE username = ?').get(username);
  
  if (!employee) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }
  
  const isValidPassword = bcrypt.compareSync(password, employee.password);
  if (!isValidPassword) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }
  
  if (!employee.is_active) {
    return res.status(403).json({ message: '账号已被禁用' });
  }
  
  const token = jwt.sign(
    { id: employee.id, username: employee.username, role: employee.role, permissions: employee.permissions },
    SECRET_KEY,
    { expiresIn: '24h' }
  );
  
  db.prepare('UPDATE employees SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(employee.id);
  
  res.json({
    token,
    user: {
      id: employee.id,
      username: employee.username,
      name: employee.name,
      role: employee.role,
      permissions: employee.permissions
    }
  });
});

router.post('/change-password', (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(userId);
  
  if (!employee) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  const isValidPassword = bcrypt.compareSync(oldPassword, employee.password);
  if (!isValidPassword) {
    return res.status(400).json({ message: '原密码错误' });
  }
  
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE employees SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hashedPassword, userId);
  
  res.json({ message: '密码修改成功' });
});

module.exports = router;
