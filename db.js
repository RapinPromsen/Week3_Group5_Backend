const mysql = require("mysql2");//susu
const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'expenses'
});
module.exports = con; //เสร็จ//