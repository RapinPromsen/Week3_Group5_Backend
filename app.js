const con = require('./db');
const express = require('express');
const bcrypt = require('bcrypt');
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// password generator
app.get('/password/:pass', (req, res) => {
    const password = req.params.pass;
    bcrypt.hash(password, 10, function(err, hash) {
        if(err) {
            return res.status(500).send('Hashing error');
        }
        res.send(hash);
    });
});

app.get('/expenses', (req, res) => {
    const { user_id, date } = req.query;

    let sql = "SELECT * FROM expense WHERE user_id = ?";
    let params = [user_id];

    if (date) {
        sql += " AND DATE(date) = ?";
        params.push(date);
    }

    con.query(sql, params, function(err, results) {
        if (err) {
            return res.status(500).send("Database server error");
        }
        res.json(results);
    });
});

app.post('/expenses/add', (req, res) => {
    const { user_id, item, paid } = req.body;

    if (!user_id || !item || !paid) {
        return res.status(400).send("Missing required fields");
    }

    const sql = "INSERT INTO expense (user_id, item, paid, date) VALUES (?, ?, ?, NOW())";
    con.query(sql, [user_id, item, paid], function(err, results) {
        if (err) {
            return res.status(500).send("Database server error");
        }
        res.status(201).json({
            message: "Expense added successfully",
            expense_id: results.insertId
        });
    });
});

app.delete('/expenses/:id', (req, res) => {
    const expenseId = req.params.id;

    if (!expenseId) {
        return res.status(400).send("Expense ID is required");
    }

    const sql = "DELETE FROM expense WHERE id = ?";
    con.query(sql, [expenseId], (err, results) => {
        if (err) {
            return res.status(500).send("Database server error");
        }

        if (results.affectedRows === 0) {
            return res.status(404).send("Expense not found");
        }

        res.status(200).json({ message: "Expense deleted successfully" });
    });
});


// login
app.post('/login', (req, res) => {
    const {username, password} = req.body;
    const sql = "SELECT id, password FROM users WHERE username = ?";
    con.query(sql, [username], function(err, results) {
        if(err) {
            return res.status(500).send("Database server error");
        }
        if (results.length === 0) {
            return res.status(401).send("Wrong password or username");
        }

        bcrypt.compare(password, results[0].password, function(err, same) {
            if(err) {
                return res.status(500).send("Hashing error");
            }
            if(same) {
                // ส่ง id กลับไปให้ client เอาไป query /expenses
                return res.json({ user_id: results[0].id });
            }
            return res.status(401).send("Wrong password or username");
        });
    })
});

// ---------- Server starts here ---------
const PORT = 3000;
app.listen(PORT, () => {
    console.log('Server is running at ' + PORT);
});