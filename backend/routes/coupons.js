const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { auth } = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  const { type, is_active, page = 1, pageSize = 20 } = req.query;
  
  let sql = 'SELECT * FROM coupons WHERE 1=1';
  const params = [];
  
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  
  if (is_active !== undefined) {
    sql += ' AND is_active = ?';
    params.push(is_active);
  }
  
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const coupons = db.prepare(sql).all(...params);
  
  res.json({ list: coupons, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', auth, (req, res) => {
  const { id } = req.params;
  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id);
  
  if (!coupon) {
    return res.status(404).json({ message: '优惠券不存在' });
  }
  
  res.json(coupon);
});

router.post('/', auth, (req, res) => {
  const { name, type, discount_amount, discount_rate, min_order_amount, total_quantity, start_date, end_date } = req.body;
  
  const result = db.prepare(`
    INSERT INTO coupons (name, type, discount_amount, discount_rate, min_order_amount, total_quantity, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, type, discount_amount, discount_rate, min_order_amount, total_quantity, start_date, end_date);
  
  res.json({ id: result.lastInsertRowid, message: '优惠券创建成功' });
});

router.put('/:id', auth, (req, res) => {
  const { id } = req.params;
  const { name, type, discount_amount, discount_rate, min_order_amount, total_quantity, start_date, end_date, is_active } = req.body;
  
  db.prepare(`
    UPDATE coupons 
    SET name = ?, type = ?, discount_amount = ?, discount_rate = ?, min_order_amount = ?, total_quantity = ?, start_date = ?, end_date = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, type, discount_amount, discount_rate, min_order_amount, total_quantity, start_date, end_date, is_active, id);
  
  res.json({ message: '优惠券更新成功' });
});

router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;
  
  const usedCoupons = db.prepare('SELECT COUNT(*) as count FROM user_coupons WHERE coupon_id = ? AND is_used = 1').get(id);
  if (usedCoupons.count > 0) {
    return res.status(400).json({ message: '该优惠券已被使用，无法删除' });
  }
  
  db.prepare('DELETE FROM user_coupons WHERE coupon_id = ?').run(id);
  db.prepare('DELETE FROM coupons WHERE id = ?').run(id);
  
  res.json({ message: '优惠券删除成功' });
});

router.get('/:id/records', auth, (req, res) => {
  const { id } = req.params;
  const { type, page = 1, pageSize = 20 } = req.query;
  
  let sql = `
    SELECT uc.*, u.username, u.phone 
    FROM user_coupons uc 
    LEFT JOIN users u ON uc.user_id = u.id 
    WHERE uc.coupon_id = ?
  `;
  const params = [id];
  
  if (type === 'received') {
    sql += ' AND uc.is_used = 0';
  } else if (type === 'used') {
    sql += ' AND uc.is_used = 1';
  }
  
  const countSql = sql.replace('SELECT uc.*, u.username, u.phone', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;
  
  sql += ' ORDER BY uc.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const records = db.prepare(sql).all(...params);
  
  res.json({ list: records, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

module.exports = router;
