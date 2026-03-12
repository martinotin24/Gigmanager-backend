const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

// 1. GET
router.get('/', async (req, res) => {
    try {
        const [quotes] = await db.query('SELECT * FROM quotes');
        res.json(quotes);
    } catch (error) {
        console.error("Error fetching quotes:", error);
        res.status(500).json({ error: "Failed to get quotes" });
    }
});

// 2. POST
router.post('/', async (req, res) => {
    try {
        const { gig_id, quote_number, valid_until, total_amount, status } = req.body;
        
        const [result] = await db.query(
            'INSERT INTO quotes (gig_id, quote_number, valid_until, total_amount, status) VALUES (?, ?, ?, ?, ?)',
            [gig_id, quote_number, valid_until, total_amount, status]
        );

        res.status(201).json({ 
            message: "Quote created successfully!", 
            quoteId: result.insertId 
        });
    } catch (error) {
        console.error("Error creating quote:", error);
        res.status(500).json({ error: "Failed to create quote" });
    }
});

// 3. PATCH
router.patch('/:id', async (req, res) => {
    try {
        const quoteId = req.params.id;
        const [existing] = await db.query('SELECT * FROM quotes WHERE id = ?', [quoteId]);

        if (existing.length === 0) return res.status(404).json({ error: "Quote not found" });

        const q = existing[0];
        const { quote_number, valid_until, total_amount, status } = req.body;

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

// 4. DELETE
router.delete('/:id', async (req, res) => {
    try {
        const quoteId = req.params.id;
        const [result] = await db.query('DELETE FROM quotes WHERE id = ?', [quoteId]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Quote not found" });
        res.json({ message: "Quote deleted successfully!" });
    } catch (error) {
        console.error("Error deleting quote:", error);
        res.status(500).json({ error: "Failed to delete quote" });
    }
});

module.exports = router;