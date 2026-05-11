const jwt = require('jsonwebtoken');
const SECRET_KEY = 'restaurant-admin-secret-key-2024';

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: '未登录' });
  }
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'token无效' });
  }
};

const checkPermission = (permission) => {
  return (req, res, next) => {
    if (req.user.role === 'admin') {
      return next();
    }
    
    const permissions = req.user.permissions ? JSON.parse(req.user.permissions) : [];
    if (permissions.includes(permission) || permissions.includes('all')) {
      next();
    } else {
      res.status(403).json({ message: '无权限' });
    }
  };
};

module.exports = { auth, checkPermission, SECRET_KEY };
