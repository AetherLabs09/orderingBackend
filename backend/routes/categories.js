const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { auth } = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
  res.json(categories);
});

router.post('/', auth, (req, res) => {
  const { name, sort_order, is_enabled } = req.body;
  
  const result = db.prepare(`
    INSERT INTO categories (name, sort_order, is_enabled)
    VALUES (?, ?, ?)
  `).run(name, sort_order || 0, is_enabled !== undefined ? is_enabled : 1);
  
  res.json({ id: result.lastInsertRowid, message: '分类创建成功' });
});

router.put('/:id', auth, (req, res) => {
  const { id } = req.params;
  const { name, sort_order, is_enabled } = req.body;
  
  db.prepare(`
    UPDATE categories 
    SET name = ?, sort_order = ?, is_enabled = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, sort_order, is_enabled, id);
  
  res.json({ message: '分类更新成功' });
});

router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;
  
  const dishes = db.prepare('SELECT COUNT(*) as count FROM dishes WHERE category_id = ?').get(id);
  if (dishes.count > 0) {
    return res.status(400).json({ message: '该分类下还有菜品，无法删除' });
  }
  
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ message: '分类删除成功' });
});

router.put('/sort', auth, (req, res) => {
  const { categories } = req.body;
  
  const updateSort = db.prepare('UPDATE categories SET sort_order = ? WHERE id = ?');
  categories.forEach((cat, index) => {
    updateSort.run(index, cat.id);
  });
  
  res.json({ message: '排序更新成功' });
});

module.exports = router;
