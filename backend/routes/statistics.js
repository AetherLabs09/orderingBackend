const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { auth } = require('../middleware/auth');

router.get('/overview', auth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  const todayStats = db.prepare(`
    SELECT 
      COUNT(*) as order_count,
      SUM(final_amount) as revenue
    FROM orders
    WHERE DATE(created_at) = ? AND status = 'completed'
  `).get(today);
  
  const totalStats = db.prepare(`
    SELECT 
      COUNT(*) as total_orders,
      SUM(final_amount) as total_revenue,
      COUNT(DISTINCT user_id) as total_users
    FROM orders
    WHERE status = 'completed'
  `).get();
  
  res.json({
    today: todayStats,
    total: totalStats
  });
});

router.get('/sales', auth, (req, res) => {
  const { startDate, endDate, type = 'day' } = req.query;
  
  let sql;
  if (type === 'day') {
    sql = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(final_amount) as revenue
      FROM orders
      WHERE status = 'completed'
    `;
  } else if (type === 'week') {
    sql = `
      SELECT 
        strftime('%Y-%W', created_at) as date,
        COUNT(*) as order_count,
        SUM(final_amount) as revenue
      FROM orders
      WHERE status = 'completed'
    `;
  } else {
    sql = `
      SELECT 
        strftime('%Y-%m', created_at) as date,
        COUNT(*) as order_count,
        SUM(final_amount) as revenue
      FROM orders
      WHERE status = 'completed'
    `;
  }
  
  const params = [];
  if (startDate) {
    sql += ' AND DATE(created_at) >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND DATE(created_at) <= ?';
    params.push(endDate);
  }
  
  sql += ' GROUP BY date ORDER BY date';
  
  const data = db.prepare(sql).all(...params);
  
  res.json(data);
});

router.get('/hot-dishes', auth, (req, res) => {
  const { startDate, endDate, limit = 10 } = req.query;
  
  let sql = `
    SELECT 
      d.id,
      d.name,
      d.image,
      SUM(oi.quantity) as total_sales,
      SUM(oi.subtotal) as total_revenue
    FROM order_items oi
    LEFT JOIN dishes d ON oi.dish_id = d.id
    LEFT JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'completed'
  `;
  
  const params = [];
  if (startDate) {
    sql += ' AND DATE(o.created_at) >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND DATE(o.created_at) <= ?';
    params.push(endDate);
  }
  
  sql += ' GROUP BY d.id ORDER BY total_sales DESC LIMIT ?';
  params.push(parseInt(limit));
  
  const dishes = db.prepare(sql).all(...params);
  
  res.json(dishes);
});

router.get('/refunds', auth, (req, res) => {
  const { startDate, endDate, page = 1, pageSize = 20 } = req.query;
  
  let sql = `
    SELECT o.*, u.username, u.phone
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.status = 'cancelled'
  `;
  const params = [];
  
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
  
  const refunds = db.prepare(sql).all(...params);
  
  res.json({ list: refunds, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/export', auth, (req, res) => {
  const { startDate, endDate, type } = req.query;
  
  let data;
  
  if (type === 'orders') {
    let sql = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(final_amount) as revenue
      FROM orders
      WHERE status = 'completed'
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
    sql += ' GROUP BY DATE(created_at) ORDER BY date';
    data = db.prepare(sql).all(...params);
  } else if (type === 'dishes') {
    let sql = `
      SELECT 
        d.name,
        SUM(oi.quantity) as total_sales,
        SUM(oi.subtotal) as total_revenue
      FROM order_items oi
      LEFT JOIN dishes d ON oi.dish_id = d.id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
    `;
    const params = [];
    if (startDate) {
      sql += ' AND DATE(o.created_at) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND DATE(o.created_at) <= ?';
      params.push(endDate);
    }
    sql += ' GROUP BY d.id ORDER BY total_sales DESC';
    data = db.prepare(sql).all(...params);
  }
  
  res.json(data);
});

module.exports = router;
