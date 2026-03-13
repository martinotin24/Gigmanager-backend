const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

// GET
router.get('/details/:id', async (req, res) => {
    try {
        const quoteId = req.params.id;
        const { user_id } = req.query;

        const query = `
            SELECT q.*, g.title as gig_title, c.first_name, c.last_name
            FROM quotes q
            JOIN gigs g ON q.gig_id = g.id
            JOIN clients c ON g.client_id = c.id
            WHERE q.id = ? AND g.user_id = ?
        `;
        const [rows] = await db.query(query, [quoteId, user_id]);

        if (rows.length === 0) return res.status(404).json({ error: "Quote not found" });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST
router.post('/', async (req, res) => {
    try {
        const { user_id, gig_id, quote_number, valid_until, total_amount, status } = req.body;

        const [gigCheck] = await db.query(
            'SELECT id FROM gigs WHERE id = ? AND user_id = ?',
            [gig_id, user_id]
        );

        if (gigCheck.length === 0) {
            return res.status(403).json({ error: "Unauthorized: Gig not found in your account." });
        }

        const query = 'INSERT INTO quotes (gig_id, quote_number, valid_until, total_amount, status) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.query(query, [gig_id, quote_number, valid_until, total_amount, status]);

        res.status(201).json({ message: "Quote created successfully!", quoteId: result.insertId });
    } catch (error) {
        console.error("Error creating quote:", error);
        res.status(500).json({ error: "Failed to create quote" });
    }
});

// PATCH
router.patch('/:id', async (req, res) => {
    try {
        const { user_id, status, total_amount } = req.body;
        const quoteId = req.params.id;

        const [exists] = await db.query('SELECT * FROM quotes WHERE id = ? AND user_id = ?', [quoteId, user_id]);
        if (exists.length === 0) return res.status(403).json({ error: "Unauthorized" });

        await db.query('UPDATE quotes SET status = ?, total_amount = ? WHERE id = ?', 
            [status ?? exists[0].status, total_amount ?? exists[0].total_amount, quoteId]);

        res.json({ message: "Quote updated!" });
    } catch (error) {
        res.status(500).json({ error: "Error" });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const quoteId = req.params.id;
        const { user_id } = req.body;

        const checkQuery = `
            SELECT q.id FROM quotes q 
            JOIN gigs g ON q.gig_id = g.id 
            WHERE q.id = ? AND g.user_id = ?
        `;
        const [resultCheck] = await db.query(checkQuery, [quoteId, user_id]);

        if (resultCheck.length === 0) return res.status(403).json({ error: "Unauthorized or Quote not found" });

        await db.query('DELETE FROM quotes WHERE id = ?', [quoteId]);
        res.json({ message: "Quote deleted successfully!" });
    } catch (error) {
        console.error("Error deleting quote:", error);
        res.status(500).json({ error: "Failed to delete quote" });
    }
});

module.exports = router;