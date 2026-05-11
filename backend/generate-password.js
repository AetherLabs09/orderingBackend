const bcrypt = require('bcryptjs');

const password = '123456';
const hash = bcrypt.hashSync(password, 10);

console.log('密码:', password);
console.log('Hash:', hash);
console.log('验证:', bcrypt.compareSync(password, hash));
