const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

// 1. GET: Detalles con JOIN
router.get('/details', async (req, res) => {
    try {
        const query = `
            SELECT 
                i.id AS invoice_id,
                i.invoice_number,
                i.total_amount,
                i.due_date,
                i.status AS invoice_status,
                g.title AS gig_title,
                c.first_name AS client_name,
                c.last_name AS client_last_name
            FROM invoices i
            JOIN gigs g ON i.gig_id = g.id
            JOIN clients c ON g.client_id = c.id
            ORDER BY i.due_date DESC
        `;
        const [details] = await db.query(query);
        res.json(details);
    } catch (error) {
        console.error("Error fetching invoice details:", error);
        res.status(500).json({ error: "Failed to fetch invoices" });
    }
});

// 2. POST: Crear factura (Ajustado a tus columnas)
router.post('/', async (req, res) => {
    try {
        const { gig_id, quote_id, invoice_number, issued_date, due_date, total_amount, status } = req.body;
        
        const [result] = await db.query(
            'INSERT INTO invoices (gig_id, quote_id, invoice_number, issued_date, due_date, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [gig_id, quote_id, invoice_number, issued_date, due_date, total_amount, status]
        );

        res.status(201).json({ 
            message: "Invoice created successfully!", 
            invoiceId: result.insertId 
        });
    } catch (error) {
        console.error("Error creating invoice:", error);
        res.status(500).json({ error: "Failed to create invoice" });
    }
});

// 3. PATCH: Actualizar factura
router.patch('/:id', async (req, res) => {
    try {
        const invoiceId = req.params.id;
        const [existing] = await db.query('SELECT * FROM invoices WHERE id = ?', [invoiceId]);

        if (existing.length === 0) return res.status(404).json({ error: "Invoice not found" });

        const inv = existing[0];
        const { invoice_number, total_amount, due_date, status } = req.body;

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
        console.error("Error updating invoice:", error);
        res.status(500).json({ error: "Failed to update invoice" });
    }
});

// 4. DELETE
router.delete('/:id', async (req, res) => {
    try {
        const invoiceId = req.params.id;
        const [result] = await db.query('DELETE FROM invoices WHERE id = ?', [invoiceId]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Invoice not found" });
        res.json({ message: "Invoice deleted successfully!" });
    } catch (error) {
        console.error("Error deleting invoice:", error);
        res.status(500).json({ error: "Failed to delete invoice" });
    }
});

module.exports = router;