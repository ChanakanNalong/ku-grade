// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db'); // Import connection จาก db.js

const router = express.Router();

// === Route สำหรับ Register ===
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    // 1. ตรวจสอบข้อมูลเบื้องต้น
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    // 2. เช็คว่ามี email นี้ในระบบแล้วหรือยัง
    db.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Database error' });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // 3. เข้ารหัสผ่าน
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 4. บันทึกข้อมูลลง Database
        db.query('INSERT INTO users SET ?', { name: name, email: email, password_hash: password_hash }, (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Could not register user' });
            }
            return res.status(201).json({ message: 'User registered successfully' });
        });
    });
});

// === Route สำหรับ Login ===
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    // 1. ค้นหา user จาก email
    db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' }); // ไม่บอกว่า email หรือ password ผิด เพื่อความปลอดภัย
        }

        const user = results[0];

        // 2. เปรียบเทียบรหัสผ่านที่ส่งมากับ hash ใน database
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 3. สร้าง JSON Web Token (JWT)
        const payload = {
            user: {
                id: user.id,
                email: user.email
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }, // Token หมดอายุใน 1 ชั่วโมง
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    });
});

module.exports = router;