const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { auth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.get('/', auth, (req, res) => {
  const { status, keyword, startDate, endDate, page = 1, pageSize = 20 } = req.query;
  
  let sql = `
    SELECT o.*, u.username, u.phone 
    FROM orders o 
    LEFT JOIN users u ON o.user_id = u.id 
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND o.status = ?';
    params.push(status);
  }
  
  if (keyword) {
    sql += ' AND (o.order_no LIKE ? OR u.username LIKE ? OR u.phone LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  
  if (startDate) {
    sql += ' AND DATE(o.created_at) >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ' AND DATE(o.created_at) <= ?';
    params.push(endDate);
  }
  
  const countSql = sql.replace('SELECT o.*, u.username, u.phone', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;
  
  sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const orders = db.prepare(sql).all(...params);
  
  res.json({ list: orders, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', auth, (req, res) => {
  const { id } = req.params;
  
  const order = db.prepare(`
    SELECT o.*, u.username, u.phone 
    FROM orders o 
    LEFT JOIN users u ON o.user_id = u.id 
    WHERE o.id = ?
  `).get(id);
  
  if (!order) {
    return res.status(404).json({ message: '订单不存在' });
  }
  
  const items = db.prepare(`
    SELECT oi.*, d.image 
    FROM order_items oi 
    LEFT JOIN dishes d ON oi.dish_id = d.id 
    WHERE oi.order_id = ?
  `).all(id);
  
  res.json({ ...order, items });
});

router.post('/', auth, (req, res) => {
  const { user_id, items, delivery_type, delivery_address, contact_phone, remark, coupon_id } = req.body;
  
  const orderNo = `ORD${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
  
  let totalAmount = 0;
  items.forEach(item => {
    totalAmount += item.price * item.quantity;
  });
  
  let discountAmount = 0;
  if (coupon_id) {
    const coupon = db.prepare('SELECT * FROM coupons WHERE id = ? AND is_active = 1').get(coupon_id);
    if (coupon) {
      if (coupon.type === 'discount') {
        discountAmount = totalAmount * (1 - coupon.discount_rate / 100);
      } else {
        discountAmount = coupon.discount_amount;
      }
    }
  }
  
  const finalAmount = totalAmount - discountAmount;
  
  const result = db.prepare(`
    INSERT INTO orders (order_no, user_id, total_amount, status, delivery_type, delivery_address, contact_phone, remark, coupon_id, discount_amount, final_amount)
    VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)
  `).run(orderNo, user_id, totalAmount, delivery_type, delivery_address, contact_phone, remark, coupon_id, discountAmount, finalAmount);
  
  const orderId = result.lastInsertRowid;
  
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, dish_id, dish_name, quantity, price, subtotal)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  items.forEach(item => {
    insertItem.run(orderId, item.dish_id, item.dish_name, item.quantity, item.price, item.price * item.quantity);
    
    db.prepare('UPDATE dishes SET stock = stock - ?, sales_count = sales_count + ? WHERE id = ?').run(item.quantity, item.quantity, item.dish_id);
  });
  
  res.json({ id: orderId, order_no: orderNo, message: '订单创建成功' });
});

router.put('/:id/status', auth, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) {
    return res.status(404).json({ message: '订单不存在' });
  }
  
  if (status === 'cancelled' && order.status !== 'cancelled') {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
    items.forEach(item => {
      db.prepare('UPDATE dishes SET stock = stock + ?, sales_count = sales_count - ? WHERE id = ?').run(item.quantity, item.quantity, item.dish_id);
    });
  }
  
  db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  
  res.json({ message: '订单状态更新成功' });
});

router.put('/:id', auth, (req, res) => {
  const { id } = req.params;
  const { delivery_address, contact_phone, remark } = req.body;
  
  db.prepare(`
    UPDATE orders 
    SET delivery_address = ?, contact_phone = ?, remark = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(delivery_address, contact_phone, remark, id);
  
  res.json({ message: '订单修改成功' });
});

router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) {
    return res.status(404).json({ message: '订单不存在' });
  }
  
  if (order.status !== 'cancelled') {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
    items.forEach(item => {
      db.prepare('UPDATE dishes SET stock = stock + ?, sales_count = sales_count - ? WHERE id = ?').run(item.quantity, item.quantity, item.dish_id);
    });
  }
  
  db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id);
  db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  
  res.json({ message: '订单删除成功' });
});

router.get('/statistics/summary', auth, (req, res) => {
  const { startDate, endDate } = req.query;
  
  let sql = `
    SELECT 
      COUNT(*) as total_orders,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
      SUM(final_amount) as total_revenue
    FROM orders
    WHERE 1=1
  `;
  const params = [];
  
  if (startDate) {
    sql += ' AND DATE(created_at) >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ' AND DATE(created_at) <= ?';
    params.push(endDate);
  }
  
  const stats = db.prepare(sql).get(...params);
  
  res.json(stats);
});

module.exports = router;
