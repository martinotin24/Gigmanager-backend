const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

// GET
router.get('/', async (req, res) => {
    try {
        const { user_id } = req.query; 
        if (!user_id) return res.status(400).json({ error: "user_id is required" });

        const [clients] = await db.query('SELECT * FROM clients WHERE user_id = ?', [user_id]);
        res.json(clients);
    } catch (error) {
        console.error("Error fetching clients:", error);
        res.status(500).json({ error: "Failed to get clients" });
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
        const clientId = req.params.id;
        const { user_id, first_name, last_name, email, phone, address_id } = req.body;

        
        const [existingClient] = await db.query('SELECT * FROM clients WHERE id = ? AND user_id = ?', [clientId, user_id]);

        if (existingClient.length === 0) {
            return res.status(403).json({ error: "Unauthorized or client not found" });
        }

        const client = existingClient[0]; 

        const newFirstName = first_name !== undefined ? first_name : client.first_name;
        const newLastName = last_name !== undefined ? last_name : client.last_name;
        const newEmail = email !== undefined ? email : client.email;
        const newPhone = phone !== undefined ? phone : client.phone;
        const newAddressId = address_id !== undefined ? address_id : client.address_id;

        await db.query(
            'UPDATE clients SET first_name = ?, last_name = ?, email = ?, phone = ?, address_id = ? WHERE id = ? AND user_id = ?',
            [newFirstName, newLastName, newEmail, newPhone, newAddressId, clientId, user_id]
        );

        res.json({ message: "Client updated successfully!" });
    } catch (error) {
        console.error("Error updating client:", error);
        res.status(500).json({ error: "Failed to update client" });
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