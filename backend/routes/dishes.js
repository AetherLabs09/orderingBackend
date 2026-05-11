const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { auth } = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  const { category_id, is_available, keyword } = req.query;
  
  let sql = `
    SELECT d.*, c.name as category_name 
    FROM dishes d 
    LEFT JOIN categories c ON d.category_id = c.id 
    WHERE 1=1
  `;
  const params = [];
  
  if (category_id) {
    sql += ' AND d.category_id = ?';
    params.push(category_id);
  }
  
  if (is_available !== undefined) {
    sql += ' AND d.is_available = ?';
    params.push(is_available);
  }
  
  if (keyword) {
    sql += ' AND d.name LIKE ?';
    params.push(`%${keyword}%`);
  }
  
  sql += ' ORDER BY d.created_at DESC';
  
  const dishes = db.prepare(sql).all(...params);
  res.json(dishes);
});

router.get('/:id', auth, (req, res) => {
  const { id } = req.params;
  const dish = db.prepare(`
    SELECT d.*, c.name as category_name 
    FROM dishes d 
    LEFT JOIN categories c ON d.category_id = c.id 
    WHERE d.id = ?
  `).get(id);
  
  if (!dish) {
    return res.status(404).json({ message: '菜品不存在' });
  }
  
  res.json(dish);
});

router.post('/', auth, (req, res) => {
  const { name, category_id, price, image, specifications, description, stock, is_available, is_recommended } = req.body;
  
  const result = db.prepare(`
    INSERT INTO dishes (name, category_id, price, image, specifications, description, stock, is_available, is_recommended)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, category_id, price, image, specifications, description, stock || 0, is_available !== undefined ? is_available : 1, is_recommended || 0);
  
  res.json({ id: result.lastInsertRowid, message: '菜品添加成功' });
});

router.put('/:id', auth, (req, res) => {
  const { id } = req.params;
  const { name, category_id, price, image, specifications, description, stock, is_available, is_recommended } = req.body;
  
  db.prepare(`
    UPDATE dishes 
    SET name = ?, category_id = ?, price = ?, image = ?, specifications = ?, description = ?, stock = ?, is_available = ?, is_recommended = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, category_id, price, image, specifications, description, stock, is_available, is_recommended, id);
  
  res.json({ message: '菜品更新成功' });
});

router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM dishes WHERE id = ?').run(id);
  res.json({ message: '菜品删除成功' });
});

router.put('/batch/status', auth, (req, res) => {
  const { ids, is_available } = req.body;
  
  const updateStatus = db.prepare('UPDATE dishes SET is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  ids.forEach(id => {
    updateStatus.run(is_available, id);
  });
  
  res.json({ message: '状态更新成功' });
});

router.put('/:id/toggle-recommend', auth, (req, res) => {
  const { id } = req.params;
  
  const dish = db.prepare('SELECT is_recommended FROM dishes WHERE id = ?').get(id);
  if (!dish) {
    return res.status(404).json({ message: '菜品不存在' });
  }
  
  db.prepare('UPDATE dishes SET is_recommended = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(dish.is_recommended ? 0 : 1, id);
  
  res.json({ message: '推荐状态更新成功' });
});

module.exports = router;
