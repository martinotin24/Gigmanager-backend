const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

// 1. READ: Obtener todos los trabajos (Gigs)
router.get('/details', async (req, res) => {
    try {
        const query = `
            SELECT 
                g.id AS gig_id,
                g.title,
                g.description,
                g.gig_date,
                g.venue,
                g.fee,
                g.status,
                c.first_name AS client_name,
                c.last_name AS client_last_name,
                c.phone AS client_phone,
                c.email AS client_email
            FROM gigs g
            JOIN clients c ON g.client_id = c.id
            ORDER BY g.gig_date ASC
        `;
        
        const [details] = await db.query(query);
        res.json(details);
    } catch (error) {
        console.error("Error fetching gig details:", error);
        res.status(500).json({ error: "Failed to get detailed gigs" });
    }
});

// 2. CREATE: Agregar un nuevo trabajo
router.post('/', async (req, res) => {
    try {
        const { user_id, client_id, title, description, gig_date, venue, fee, status } = req.body;
        const [result] = await db.query(
            'INSERT INTO gigs (user_id, client_id, title, description, gig_date, venue, fee, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [user_id, client_id, title, description, gig_date, venue, fee, status]
        );
        res.status(201).json({ message: "Gig created successfully!", gigId: result.insertId });
    } catch (error) {
        console.error("Error creating gig:", error);
        res.status(500).json({ error: "Failed to create gig" });
    }
});

// 3. UPDATE (PATCH): Actualizar parte de un trabajo
router.patch('/:id', async (req, res) => {
    try {
        const gigId = req.params.id;
        const [existingGig] = await db.query('SELECT * FROM gigs WHERE id = ?', [gigId]);

        if (existingGig.length === 0) return res.status(404).json({ error: "Gig not found" });

        const gig = existingGig[0];
        const { title, description, gig_date, venue, fee, status } = req.body;

        const newTitle = title ?? gig.title;
        const newDesc = description ?? gig.description;
        const newDate = gig_date ?? gig.gig_date;
        const newVenue = venue ?? gig.venue;
        const newFee = fee ?? gig.fee;
        const newStatus = status ?? gig.status;

        await db.query(
            'UPDATE gigs SET title = ?, description = ?, gig_date = ?, venue = ?, fee = ?, status = ? WHERE id = ?',
            [newTitle, newDesc, newDate, newVenue, newFee, newStatus, gigId]
        );

        res.json({ message: "Gig updated successfully!" });
    } catch (error) {
        console.error("Error updating gig:", error);
        res.status(500).json({ error: "Failed to update gig" });
    }
});

// 4. DELETE: Borrar un trabajo
router.delete('/:id', async (req, res) => {
    try {
        const gigId = req.params.id;
        const [result] = await db.query('DELETE FROM gigs WHERE id = ?', [gigId]);

        if (result.affectedRows === 0) return res.status(404).json({ error: "Gig not found" });

        res.json({ message: "Gig deleted successfully!" });
    } catch (error) {
        console.error("Error deleting gig:", error);
        res.status(500).json({ error: "Failed to delete gig" });
    }
});

module.exports = router;