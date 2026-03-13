const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST
router.post('/', async (req, res) => {
    try {
        const { user_id, street, city, province, postal_code, country } = req.body;

        if (!user_id) {
            return res.status(400).json({ error: "User ID is required for address ownership." });
        }

        const query = `
            INSERT INTO addresses (user_id, street, city, province, postal_code, country) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.query(query, [
            user_id, 
            street, 
            city, 
            province || 'BC', 
            postal_code, 
            country || 'Canada'
        ]);

        res.status(201).json({ 
            message: "Address created successfully!", 
            addressId: result.insertId 
        });
    } catch (error) {
        console.error("Error creating address:", error);
        res.status(500).json({ error: "Failed to create address" });
    }
});

// GET
router.get('/', async (req, res) => {
    try {
        const { user_id } = req.query; 
        
        if (!user_id) return res.status(400).json({ error: "Missing user_id" });

        const [rows] = await db.query('SELECT * FROM addresses WHERE user_id = ?', [user_id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error fetching addresses" });
    }
});

// UPDATE
router.patch('/:id', async (req, res) => {
    try {
        const { user_id, street, city, province, postal_code, country } = req.body;
        const addressId = req.params.id;

        const [exists] = await db.query('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [addressId, user_id]);
        if (exists.length === 0) return res.status(403).json({ error: "Unauthorized or address not found" });

        const addr = exists[0];
        const query = `
            UPDATE addresses 
            SET street = ?, city = ?, province = ?, postal_code = ?, country = ?
            WHERE id = ?
        `;
        
        await db.query(query, [
            street ?? addr.street, 
            city ?? addr.city, 
            province ?? addr.province, 
            postal_code ?? addr.postal_code, 
            country ?? addr.country, 
            addressId
        ]);

        res.json({ message: "Address updated successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Error updating address" });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const { user_id } = req.body;
        const addressId = req.params.id;

        const [result] = await db.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [addressId, user_id]);

        if (result.affectedRows === 0) {
            return res.status(403).json({ error: "Unauthorized or address not found" });
        }

        res.json({ message: "Address deleted successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting address" });
    }
});
module.exports = router;