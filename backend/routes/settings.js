const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { auth } = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  const settings = db.prepare('SELECT * FROM system_settings LIMIT 1').get();
  res.json(settings || {});
});

router.put('/', auth, (req, res) => {
  const { shop_name, business_hours_start, business_hours_end, accept_orders, max_image_size, auto_cancel_minutes } = req.body;
  
  const existing = db.prepare('SELECT * FROM system_settings LIMIT 1').get();
  
  if (existing) {
    db.prepare(`
      UPDATE system_settings 
      SET shop_name = ?, business_hours_start = ?, business_hours_end = ?, accept_orders = ?, max_image_size = ?, auto_cancel_minutes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(shop_name, business_hours_start, business_hours_end, accept_orders, max_image_size, auto_cancel_minutes, existing.id);
    
    res.json({ message: '系统设置更新成功' });
  } else {
    const result = db.prepare(`
      INSERT INTO system_settings (shop_name, business_hours_start, business_hours_end, accept_orders, max_image_size, auto_cancel_minutes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(shop_name, business_hours_start, business_hours_end, accept_orders, max_image_size, auto_cancel_minutes);
    
    res.json({ id: result.lastInsertRowid, message: '系统设置创建成功' });
  }
});

router.get('/logs', auth, (req, res) => {
  const { employee_id, action, startDate, endDate, page = 1, pageSize = 50 } = req.query;
  
  let sql = `
    SELECT ol.*, e.name as employee_name
    FROM operation_logs ol
    LEFT JOIN employees e ON ol.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];
  
  if (employee_id) {
    sql += ' AND ol.employee_id = ?';
    params.push(employee_id);
  }
  
  if (action) {
    sql += ' AND ol.action LIKE ?';
    params.push(`%${action}%`);
  }
  
  if (startDate) {
    sql += ' AND DATE(ol.created_at) >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ' AND DATE(ol.created_at) <= ?';
    params.push(endDate);
  }
  
  const countSql = sql.replace('SELECT ol.*, e.name as employee_name', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;
  
  sql += ' ORDER BY ol.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const logs = db.prepare(sql).all(...params);
  
  res.json({ list: logs, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.post('/backup', auth, (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-${timestamp}.sqlite`);
  
  const sourceFile = path.join(__dirname, '../db/database.sqlite');
  fs.copyFileSync(sourceFile, backupFile);
  
  res.json({ message: '数据备份成功', file: backupFile });
});

router.get('/backups', auth, (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    return res.json([]);
  }
  
  const files = fs.readdirSync(backupDir)
    .filter(file => file.endsWith('.sqlite'))
    .map(file => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        created_at: stats.birthtime
      };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  res.json(files);
});

module.exports = router;
