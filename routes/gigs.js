const express = require('express');
const router = express.Router();
const db = require('../config/db');
const Joi = require('joi');

// 1. Esquema de Validación para Creación
const gigSchema = Joi.object({
    user_id: Joi.number().integer().required(),
    client_id: Joi.number().integer().required(),
    address_id: Joi.number().integer().required(),
    title: Joi.string().max(150).required(),
    description: Joi.string().allow('', null),
    gig_date: Joi.date().iso().required(), // Valida formato de fecha ISO
    venue: Joi.string().max(255).required(),
    fee: Joi.number().precision(2).positive().required(),
    status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed').default('pending')
});

// 2. Esquema para Actualización (PATCH)
const updateGigSchema = Joi.object({
    user_id: Joi.number().integer().required(),
    title: Joi.string().max(150),
    description: Joi.string().allow('', null),
    gig_date: Joi.date().iso(),
    venue: Joi.string().max(255),
    fee: Joi.number().precision(2).positive(),
    status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed')
});

// GET - Detalle con JOIN (Blindado)
router.get('/details/:id', async (req, res) => {
    try {
        const gigId = req.params.id;
        const { user_id } = req.query;

        if (!user_id || isNaN(gigId)) {
            return res.status(400).json({ error: "Invalid gig ID or missing user_id" });
        }

        const query = `
            SELECT g.*, c.first_name, c.last_name, a.street
            FROM gigs g
            JOIN clients c ON g.client_id = c.id
            JOIN addresses a ON g.address_id = a.id
            WHERE g.id = ? AND g.user_id = ?
        `;
        const [rows] = await db.query(query, [gigId, user_id]);

        if (rows.length === 0) return res.status(404).json({ error: "Gig not found or unauthorized" });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST - Crear Gig Blindado
router.post('/', async (req, res) => {
    try {
        const { error, value } = gigSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { user_id, client_id, address_id, title, description, gig_date, venue, fee, status } = value;

        // Seguridad: Verificar que el cliente pertenezca al usuario
        const [clientCheck] = await db.query(
            'SELECT id FROM clients WHERE id = ? AND user_id = ?',
            [client_id, user_id]
        );

        if (clientCheck.length === 0) {
            return res.status(403).json({ error: "Unauthorized: Client not found in your account." });
        }

        const query = `
            INSERT INTO gigs (user_id, client_id, address_id, title, description, gig_date, venue, fee, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [user_id, client_id, address_id, title, description, gig_date, venue, fee, status]);

        res.status(201).json({ message: "Gig created successfully!", gigId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: "Failed to create gig" });
    }
});

// PATCH - Actualización Segura
router.patch('/:id', async (req, res) => {
    try {
        const gigId = req.params.id;
        const { error, value } = updateGigSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { user_id, title, description, gig_date, venue, fee, status } = value;

        const [exists] = await db.query('SELECT * FROM gigs WHERE id = ? AND user_id = ?', [gigId, user_id]);
        if (exists.length === 0) return res.status(403).json({ error: "Unauthorized or gig not found" });

        const g = exists[0];
        const query = `
            UPDATE gigs 
            SET title=?, description=?, gig_date=?, venue=?, fee=?, status=? 
            WHERE id=? AND user_id=?
        `;
        
        await db.query(query, [
            title ?? g.title, 
            description ?? g.description, 
            gig_date ?? g.gig_date, 
            venue ?? g.venue, 
            fee ?? g.fee, 
            status ?? g.status, 
            gigId,
            user_id
        ]);

        res.json({ message: "Gig updated successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Error updating gig" });
    }
});

// DELETE - Borrado Seguro
router.delete('/:id', async (req, res) => {
    try {
        const gigId = req.params.id;
        const { user_id } = req.body;

        if (!user_id) return res.status(400).json({ error: "user_id is required in body" });

        const [result] = await db.query('DELETE FROM gigs WHERE id = ? AND user_id = ?', [gigId, user_id]);

        if (result.affectedRows === 0) return res.status(403).json({ error: "Unauthorized or Gig not found" });

        res.json({ message: "Gig deleted successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete gig" });
    }
});

module.exports = router;