const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { auth } = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  const settings = db.prepare('SELECT * FROM delivery_settings WHERE is_active = 1').get();
  res.json(settings || {});
});

router.post('/', auth, (req, res) => {
  const { delivery_range, min_order_amount, delivery_fee, pickup_address, business_hours_start, business_hours_end, allow_reservation } = req.body;
  
  const existing = db.prepare('SELECT * FROM delivery_settings WHERE is_active = 1').get();
  
  if (existing) {
    db.prepare(`
      UPDATE delivery_settings 
      SET delivery_range = ?, min_order_amount = ?, delivery_fee = ?, pickup_address = ?, business_hours_start = ?, business_hours_end = ?, allow_reservation = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(delivery_range, min_order_amount, delivery_fee, pickup_address, business_hours_start, business_hours_end, allow_reservation, existing.id);
    
    res.json({ message: '配送设置更新成功' });
  } else {
    const result = db.prepare(`
      INSERT INTO delivery_settings (delivery_range, min_order_amount, delivery_fee, pickup_address, business_hours_start, business_hours_end, allow_reservation)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(delivery_range, min_order_amount, delivery_fee, pickup_address, business_hours_start, business_hours_end, allow_reservation);
    
    res.json({ id: result.lastInsertRowid, message: '配送设置创建成功' });
  }
});

router.put('/:id/toggle', auth, (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  
  db.prepare('UPDATE delivery_settings SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(is_active, id);
  
  res.json({ message: is_active ? '配送设置已启用' : '配送设置已禁用' });
});

module.exports = router;
