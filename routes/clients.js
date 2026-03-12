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

// PATCH: Actualización parcial de un cliente
router.patch('/:id', async (req, res) => {
    try {
        const clientId = req.params.id;

        const [existingClient] = await db.query('SELECT * FROM clients WHERE id = ?', [clientId]);

        if (existingClient.length === 0) {
            return res.status(404).json({ error: "Client not found" });
        }

        const client = existingClient[0]; 

        const { first_name, last_name, email, phone, notes } = req.body;

        const newFirstName = first_name !== undefined ? first_name : client.first_name;
        const newLastName = last_name !== undefined ? last_name : client.last_name;
        const newEmail = email !== undefined ? email : client.email;
        const newPhone = phone !== undefined ? phone : client.phone;
        const newNotes = notes !== undefined ? notes : client.notes;

        await db.query(
            'UPDATE clients SET first_name = ?, last_name = ?, email = ?, phone = ?, notes = ? WHERE id = ?',
            [newFirstName, newLastName, newEmail, newPhone, newNotes, clientId]
        );

        res.json({ message: "Client partially updated (PATCH) successfully!" });
    } catch (error) {
        console.error("Error updating client with PATCH:", error);
        res.status(500).json({ error: "Failed to update client" });
    }
});

// DELETE: Remove a client
router.delete('/:id', async (req, res) => {
    try {
        const clientId = req.params.id;

        const [result] = await db.query('DELETE FROM clients WHERE id = ?', [clientId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Client not found" });
        }

        res.json({ message: "Client deleted successfully!" });
    } catch (error) {
        console.error("Error deleting client:", error);
        res.status(500).json({ error: "Failed to delete client" });
    }
});


module.exports = router;