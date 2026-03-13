const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

// GET
router.get('/details/:id', async (req, res) => {
    try {
        const gigId = req.params.id;
        const { user_id } = req.query;

        const query = `
            SELECT g.*, c.first_name, c.last_name, a.street
            FROM gigs g
            JOIN clients c ON g.client_id = c.id
            JOIN addresses a ON g.address_id = a.id
            WHERE g.id = ? AND g.user_id = ?
        `;
        const [rows] = await db.query(query, [gigId, user_id]);

        if (rows.length === 0) return res.status(404).json({ error: "Gig not found" });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST
router.post('/', async (req, res) => {
    try {
        const { user_id, client_id, title, description, gig_date, venue, fee, status } = req.body;

        const [clientCheck] = await db.query(
            'SELECT id FROM clients WHERE id = ? AND user_id = ?',
            [client_id, user_id]
        );

        if (clientCheck.length === 0) {
            return res.status(403).json({ error: "Unauthorized: Client not found in your account." });
        }

        const query = `
            INSERT INTO gigs (user_id, client_id, title, description, gig_date, venue, fee, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [user_id, client_id, title, description, gig_date, venue, fee, status]);

        res.status(201).json({ message: "Gig created successfully!", gigId: result.insertId });
    } catch (error) {
        console.error("Error creating gig:", error);
        res.status(500).json({ error: "Failed to create gig" });
    }
});

// PATCH
router.patch('/:id', async (req, res) => {
    try {
        const { user_id, title, description, gig_date, venue, fee, status } = req.body;
        const gigId = req.params.id;

        const [exists] = await db.query('SELECT * FROM gigs WHERE id = ? AND user_id = ?', [gigId, user_id]);
        if (exists.length === 0) return res.status(403).json({ error: "Unauthorized or gig not found" });

        const g = exists[0];
        const query = `UPDATE gigs SET title=?, description=?, gig_date=?, venue=?, fee=?, status=? WHERE id=?`;
        
        await db.query(query, [
            title ?? g.title, 
            description ?? g.description, 
            gig_date ?? g.gig_date, 
            venue ?? g.venue, 
            fee ?? g.fee, 
            status ?? g.status, 
            gigId
        ]);

        res.json({ message: "Gig updated successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Error updating gig" });
    }
});

//DELETE
router.delete('/:id', async (req, res) => {
    try {
        const gigId = req.params.id;
        const { user_id } = req.body;

        const [result] = await db.query('DELETE FROM gigs WHERE id = ? AND user_id = ?', [gigId, user_id]);

        if (result.affectedRows === 0) return res.status(403).json({ error: "Unauthorized or Gig not found" });

        res.json({ message: "Gig deleted successfully!" });
    } catch (error) {
        console.error("Error deleting gig:", error);
        res.status(500).json({ error: "Failed to delete gig" });
    }
});

module.exports = router;