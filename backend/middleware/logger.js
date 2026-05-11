const db = require('../db/database');

const logOperation = (action, details) => {
  return (req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
      if (req.user) {
        const log = db.prepare(`
          INSERT INTO operation_logs (employee_id, action, details, ip_address)
          VALUES (?, ?, ?, ?)
        `);
        log.run(req.user.id, action, details, req.ip);
      }
      originalSend.call(this, data);
    };
    next();
  };
};

module.exports = logOperation;
