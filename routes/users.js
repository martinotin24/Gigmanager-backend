const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST
router.post('/', async (req, res) => {
    try {
        const { firebase_uid, email, full_name } = req.body;

        if (!firebase_uid) {
            return res.status(400).json({ error: "Firebase UID is required" });
        }

        const query = 'INSERT INTO users (firebase_uid, email, full_name) VALUES (?, ?, ?)';
        const [result] = await db.query(query, [firebase_uid, email, full_name]);

        res.status(201).json({ 
            message: "User profile linked with Firebase successfully!", 
            userId: result.insertId 
        });
    } catch (error) {
        console.error("Error linking user:", error);
        res.status(500).json({ error: "Failed to link user. Email might already exist." });
    }
});

module.exports = router;