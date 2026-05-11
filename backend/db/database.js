const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbDir = path.join(__dirname, '..', '..', 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'database.sqlite');
const initSqlPath = path.join(__dirname, 'init.sql');

let db;
try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'").get();
  if (!tableCheck) {
    const initSql = fs.readFileSync(initSqlPath, 'utf-8');
    db.exec(initSql);
    
    const hashedPassword = bcrypt.hashSync('123456', 10);
    db.prepare(`
      INSERT INTO employees (username, password, name, role, permissions, is_active) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('admin', hashedPassword, '系统管理员', 'admin', 'all', 1);
    
    console.log('数据库初始化完成');
    console.log('默认管理员账号: admin');
    console.log('默认密码: 123456');
  }
} catch (error) {
  console.error('数据库初始化失败:', error);
  throw error;
}

module.exports = db;
