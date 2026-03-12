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
                g.id AS gig_id, g.title, g.description, g.gig_date, g.venue, g.fee, g.status,
                c.first_name AS client_name, c.last_name AS client_last_name,
                c.phone AS client_phone, c.email AS client_email
            FROM gigs g
            JOIN clients c ON g.client_id = c.id
            WHERE g.user_id = ?
            ORDER BY g.gig_date ASC
        `;
        
        const [details] = await db.query(query, [user_id]);
        res.json(details);
    } catch (error) {
        console.error("Error fetching gig details:", error);
        res.status(500).json({ error: "Failed to get detailed gigs" });
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
        const gigId = req.params.id;
        const { user_id, title, description, gig_date, venue, fee, status } = req.body;

        const [existingGig] = await db.query('SELECT * FROM gigs WHERE id = ? AND user_id = ?', [gigId, user_id]);
        if (existingGig.length === 0) return res.status(403).json({ error: "Unauthorized or Gig not found" });

        const gig = existingGig[0];
        const newTitle = title ?? gig.title;
        const newDesc = description ?? gig.description;
        const newDate = gig_date ?? gig.gig_date;
        const newVenue = venue ?? gig.venue;
        const newFee = fee ?? gig.fee;
        const newStatus = status ?? gig.status;

        await db.query(
            'UPDATE gigs SET title = ?, description = ?, gig_date = ?, venue = ?, fee = ?, status = ? WHERE id = ? AND user_id = ?',
            [newTitle, newDesc, newDate, newVenue, newFee, newStatus, gigId, user_id]
        );

        res.json({ message: "Gig updated successfully!" });
    } catch (error) {
        console.error("Error updating gig:", error);
        res.status(500).json({ error: "Failed to update gig" });
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