const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

// GET
router.get('/details/:id', async (req, res) => {
    try {
        const clientId = req.params.id;
        const { user_id } = req.query;

        const query = `
            SELECT c.*, a.street, a.city, a.province, a.postal_code, a.country
            FROM clients c
            LEFT JOIN addresses a ON c.address_id = a.id
            WHERE c.id = ? AND c.user_id = ?
        `;
        
        const [rows] = await db.query(query, [clientId, user_id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Client not found or unauthorized" });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("Error fetching client details:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST
router.post('/', async (req, res) => {
    try {
        const { user_id, address_id, first_name, last_name, email, phone } = req.body;

        const query = `
            INSERT INTO clients (user_id, address_id, first_name, last_name, email, phone) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(query, [
            user_id, 
            address_id || null, 
            first_name, 
            last_name, 
            email, 
            phone
        ]);

        res.status(201).json({ message: "Client created successfully!", clientId: result.insertId });
    } catch (error) {
        console.error("Error creating client:", error);
        res.status(500).json({ error: "Failed to create client" });
    }
});

// PATCH
router.patch('/:id', async (req, res) => {
    try {
        const { user_id, first_name, last_name, email, phone } = req.body;
        const clientId = req.params.id;

        const [exists] = await db.query('SELECT * FROM clients WHERE id = ? AND user_id = ?', [clientId, user_id]);
        if (exists.length === 0) return res.status(403).json({ error: "Unauthorized or client not found" });

        const c = exists[0];
        const query = `UPDATE clients SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE id = ?`;
        
        await db.query(query, [
            first_name ?? c.first_name, 
            last_name ?? c.last_name, 
            email ?? c.email, 
            phone ?? c.phone, 
            clientId
        ]);

        res.json({ message: "Client updated successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Error updating client" });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const clientId = req.params.id;
        const { user_id } = req.body;

        const [result] = await db.query('DELETE FROM clients WHERE id = ? AND user_id = ?', [clientId, user_id]);

        if (result.affectedRows === 0) {
            return res.status(403).json({ error: "Unauthorized or client not found" });
        }

        res.json({ message: "Client deleted successfully!" });
    } catch (error) {
        console.error("Error deleting client:", error);
        res.status(500).json({ error: "Failed to delete client" });
    }
});

module.exports = router;