const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Go up one folder to find the database connection

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

module.exports = router;