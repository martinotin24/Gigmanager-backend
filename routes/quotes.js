const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

// GET
router.get('/details', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: "user_id is required" });

        const query = `
            SELECT 
                q.id AS quote_id, q.quote_number, q.total_amount, q.status AS quote_status,
                g.title AS event_title, g.gig_date,
                c.first_name AS client_name, c.last_name AS client_last_name
            FROM quotes q
            JOIN gigs g ON q.gig_id = g.id
            JOIN clients c ON g.client_id = c.id
            WHERE g.user_id = ?
        `;
        
        const [details] = await db.query(query, [user_id]);
        res.json(details);
    } catch (error) {
        console.error("Error fetching quote details:", error);
        res.status(500).json({ error: "Failed to get detailed quotes" });
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
        const quoteId = req.params.id;
        const { user_id, quote_number, valid_until, total_amount, status } = req.body;

        const checkQuery = `
            SELECT q.id FROM quotes q 
            JOIN gigs g ON q.gig_id = g.id 
            WHERE q.id = ? AND g.user_id = ?
        `;
        const [existing] = await db.query(checkQuery, [quoteId, user_id]);

        if (existing.length === 0) return res.status(403).json({ error: "Unauthorized or Quote not found" });

        const [quoteData] = await db.query('SELECT * FROM quotes WHERE id = ?', [quoteId]);
        const q = quoteData[0];

        const newNum = quote_number ?? q.quote_number;
        const newValid = valid_until ?? q.valid_until;
        const newAmount = total_amount ?? q.total_amount;
        const newStatus = status ?? q.status;

        await db.query(
            'UPDATE quotes SET quote_number = ?, valid_until = ?, total_amount = ?, status = ? WHERE id = ?',
            [newNum, newValid, newAmount, newStatus, quoteId]
        );

        res.json({ message: "Quote updated successfully!" });
    } catch (error) {
        console.error("Error updating quote:", error);
        res.status(500).json({ error: "Failed to update quote" });
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