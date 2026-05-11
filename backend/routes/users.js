const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { auth } = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  const { keyword, is_disabled, page = 1, pageSize = 20 } = req.query;
  
  let sql = 'SELECT * FROM users WHERE 1=1';
  const params = [];
  
  if (keyword) {
    sql += ' AND (username LIKE ? OR phone LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  if (is_disabled !== undefined) {
    sql += ' AND is_disabled = ?';
    params.push(is_disabled);
  }
  
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const users = db.prepare(sql).all(...params);
  
  res.json({ list: users, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', auth, (req, res) => {
  const { id } = req.params;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(id);
  
  res.json({ ...user, recentOrders: orders });
});

router.put('/:id/disable', auth, (req, res) => {
  const { id } = req.params;
  const { is_disabled } = req.body;
  
  db.prepare('UPDATE users SET is_disabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(is_disabled, id);
  
  res.json({ message: is_disabled ? '用户已禁用' : '用户已启用' });
});

router.get('/:id/orders', auth, (req, res) => {
  const { id } = req.params;
  const { status, page = 1, pageSize = 20 } = req.query;
  
  let sql = 'SELECT * FROM orders WHERE user_id = ?';
  const params = [id];
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const orders = db.prepare(sql).all(...params);
  
  res.json({ list: orders, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id/consumption', auth, (req, res) => {
  const { id } = req.params;
  
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as order_count,
      SUM(final_amount) as total_amount,
      AVG(final_amount) as avg_amount
    FROM orders 
    WHERE user_id = ? AND status = 'completed'
  `).get(id);
  
  res.json(stats);
});

module.exports = router;
