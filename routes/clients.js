const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

// GET: Fetch all clients
router.get('/', async (req, res) => {
    try {
        const [clients] = await db.query('SELECT * FROM clients');
        res.json(clients);
    } catch (error) {
        console.error("Error fetching clients:", error);
        res.status(500).json({ error: "Failed to get clients from the database" });
    }
});

// POST: Add new client
router.post('/', async (req, res) => {
    try {
        const { user_id, first_name, last_name, email, phone, notes } = req.body;

        const [result] = await db.query(
            'INSERT INTO clients (user_id, first_name, last_name, email, phone, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, first_name, last_name, email, phone, notes]
        );

        res.status(201).json({ 
            message: "Client created successfully!", 
            clientId: result.insertId 
        });
    } catch (error) {
        console.error("Error creating client:", error);
        res.status(500).json({ error: "Failed to create client in the database" });
    }
});
module.exports = router;