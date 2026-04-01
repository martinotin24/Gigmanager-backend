const express = require('express');
const router = express.Router();
const db = require('../config/db');
const Joi = require('joi');

// 1. Esquema de Validación para Creación
const quoteSchema = Joi.object({
    user_id: Joi.number().integer().required(),
    gig_id: Joi.number().integer().required(),
    quote_number: Joi.string().max(50).required(),
    valid_until: Joi.date().iso().required(),
    total_amount: Joi.number().precision(2).positive().required(),
    status: Joi.string().valid('Pending', 'Accepted', 'Rejected', 'Expired').default('Pending')
});

// 2. Esquema para Actualización (PATCH)
const updateQuoteSchema = Joi.object({
    user_id: Joi.number().integer().required(),
    status: Joi.string().valid('Pending', 'Accepted', 'Rejected', 'Expired'),
    total_amount: Joi.number().precision(2).positive()
});

// GET - Detalle con JOIN (Blindado)
router.get('/details/:id', async (req, res) => {
    try {
        const quoteId = req.params.id;
        const { user_id } = req.query;

        if (!user_id || isNaN(quoteId)) {
            return res.status(400).json({ error: "Invalid quote ID or missing user_id" });
        }

        const query = `
            SELECT q.*, g.title as gig_title, c.first_name, c.last_name
            FROM quotes q
            JOIN gigs g ON q.gig_id = g.id
            JOIN clients c ON g.client_id = c.id
            WHERE q.id = ? AND g.user_id = ?
        `;
        const [rows] = await db.query(query, [quoteId, user_id]);

        if (rows.length === 0) return res.status(404).json({ error: "Quote not found or unauthorized" });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST - Crear Quote Blindada
router.post('/', async (req, res) => {
    try {
        const { error, value } = quoteSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { user_id, gig_id, quote_number, valid_until, total_amount, status } = value;

        // Verificar propiedad del Gig antes de cotizar
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
        res.status(500).json({ error: "Failed to create quote" });
    }
});

// PATCH - Actualización Segura
router.patch('/:id', async (req, res) => {
    try {
        const quoteId = req.params.id;
        const { error, value } = updateQuoteSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { user_id, status, total_amount } = value;

        // Verificar propiedad mediante JOIN con Gigs
        const checkQuery = `
            SELECT q.* FROM quotes q 
            JOIN gigs g ON q.gig_id = g.id 
            WHERE q.id = ? AND g.user_id = ?
        `;
        const [exists] = await db.query(checkQuery, [quoteId, user_id]);
        
        if (exists.length === 0) return res.status(403).json({ error: "Unauthorized or quote not found" });

        const q = exists[0];
        await db.query('UPDATE quotes SET status = ?, total_amount = ? WHERE id = ?', 
            [status ?? q.status, total_amount ?? q.total_amount, quoteId]);

        res.json({ message: "Quote updated successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Error updating quote" });
    }
});

// DELETE - Borrado Seguro
router.delete('/:id', async (req, res) => {
    try {
        const quoteId = req.params.id;
        const { user_id } = req.body;

        if (!user_id) return res.status(400).json({ error: "user_id is required in body" });

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
        res.status(500).json({ error: "Failed to delete quote" });
    }
});

module.exports = router;