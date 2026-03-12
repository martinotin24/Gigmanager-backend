const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

// GET
router.get('/details/:id', async (req, res) => {
    try {
        const invoiceId = req.params.id;
        const { user_id } = req.query; 

        if (!user_id) return res.status(400).json({ error: "user_id is required" });

        const query = `
            SELECT 
                i.invoice_number, i.total_amount, i.status,
                c.first_name, c.last_name, 
                a.street, a.city, a.postal_code
            FROM invoices i
            JOIN gigs g ON i.gig_id = g.id
            JOIN clients c ON g.client_id = c.id
            JOIN addresses a ON c.address_id = a.id
            WHERE i.id = ? AND g.user_id = ?
        `;
        const [rows] = await db.query(query, [invoiceId, user_id]);
        
        if (rows.length === 0) return res.status(403).json({ error: "Unauthorized or Invoice not found" });
        
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener detalle de factura" });
    }
});

// POST
router.post('/', async (req, res) => {
    try {
        const { user_id, gig_id, quote_id, invoice_number, issued_date, due_date, total_amount, status } = req.body;

        const [gigCheck] = await db.query(
            'SELECT id FROM gigs WHERE id = ? AND user_id = ?',
            [gig_id, user_id]
        );

        if (gigCheck.length === 0) {
            return res.status(403).json({ error: "Unauthorized: Cannot invoice a gig you don't own." });
        }

        const query = `
            INSERT INTO invoices (gig_id, quote_id, invoice_number, issued_date, due_date, total_amount, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [
            gig_id, 
            quote_id || null, 
            invoice_number, 
            issued_date, 
            due_date, 
            total_amount, 
            status
        ]);

        res.status(201).json({ message: "Invoice created successfully!", invoiceId: result.insertId });
    } catch (error) {
        console.error("Error creating invoice:", error);
        res.status(500).json({ error: "Failed to create invoice" });
    }
});

// PATCH
router.patch('/:id', async (req, res) => {
    try {
        const invoiceId = req.params.id;
        const { user_id, invoice_number, total_amount, due_date, status } = req.body;

        const checkQuery = `
            SELECT i.id FROM invoices i 
            JOIN gigs g ON i.gig_id = g.id 
            WHERE i.id = ? AND g.user_id = ?
        `;
        const [existing] = await db.query(checkQuery, [invoiceId, user_id]);

        if (existing.length === 0) return res.status(403).json({ error: "Unauthorized or Invoice not found" });

        const [invData] = await db.query('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
        const inv = invData[0];

        const newNum = invoice_number ?? inv.invoice_number;
        const newAmount = total_amount ?? inv.total_amount;
        const newDueDate = due_date ?? inv.due_date;
        const newStatus = status ?? inv.status;

        await db.query(
            'UPDATE invoices SET invoice_number = ?, total_amount = ?, due_date = ?, status = ? WHERE id = ?',
            [newNum, newAmount, newDueDate, newStatus, invoiceId]
        );

        res.json({ message: "Invoice updated successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update invoice" });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const invoiceId = req.params.id;
        const { user_id } = req.body;

        const checkQuery = `
            SELECT i.id FROM invoices i 
            JOIN gigs g ON i.gig_id = g.id 
            WHERE i.id = ? AND g.user_id = ?
        `;
        const [resultCheck] = await db.query(checkQuery, [invoiceId, user_id]);

        if (resultCheck.length === 0) return res.status(403).json({ error: "Unauthorized or Invoice not found" });

        await db.query('DELETE FROM invoices WHERE id = ?', [invoiceId]);
        res.json({ message: "Invoice deleted successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete invoice" });
    }
});

module.exports = router;