const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { auth } = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  const { rating, is_hidden, page = 1, pageSize = 20 } = req.query;
  
  let sql = `
    SELECT r.*, u.username, u.phone, o.order_no, d.name as dish_name
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN orders o ON r.order_id = o.id
    LEFT JOIN dishes d ON r.dish_id = d.id
    WHERE 1=1
  `;
  const params = [];
  
  if (rating) {
    if (rating === 'good') {
      sql += ' AND r.rating >= 4';
    } else if (rating === 'bad') {
      sql += ' AND r.rating < 4';
    }
  }
  
  if (is_hidden !== undefined) {
    sql += ' AND r.is_hidden = ?';
    params.push(is_hidden);
  }
  
  const countSql = sql.replace('SELECT r.*, u.username, u.phone, o.order_no, d.name as dish_name', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;
  
  sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const reviews = db.prepare(sql).all(...params);
  
  res.json({ list: reviews, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', auth, (req, res) => {
  const { id } = req.params;
  
  const review = db.prepare(`
    SELECT r.*, u.username, u.phone, o.order_no, d.name as dish_name
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN orders o ON r.order_id = o.id
    LEFT JOIN dishes d ON r.dish_id = d.id
    WHERE r.id = ?
  `).get(id);
  
  if (!review) {
    return res.status(404).json({ message: '评价不存在' });
  }
  
  res.json(review);
});

router.put('/:id/reply', auth, (req, res) => {
  const { id } = req.params;
  const { reply } = req.body;
  
  db.prepare(`
    UPDATE reviews 
    SET reply = ?, reply_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(reply, id);
  
  res.json({ message: '回复成功' });
});

router.put('/:id/hide', auth, (req, res) => {
  const { id } = req.params;
  const { is_hidden } = req.body;
  
  db.prepare('UPDATE reviews SET is_hidden = ? WHERE id = ?').run(is_hidden, id);
  
  res.json({ message: is_hidden ? '评价已隐藏' : '评价已显示' });
});

router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
  res.json({ message: '评价删除成功' });
});

router.get('/statistics/summary', auth, (req, res) => {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_reviews,
      AVG(rating) as avg_rating,
      SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as good_reviews,
      SUM(CASE WHEN rating < 4 THEN 1 ELSE 0 END) as bad_reviews
    FROM reviews
    WHERE is_hidden = 0
  `).get();
  
  res.json(stats);
});

module.exports = router;
