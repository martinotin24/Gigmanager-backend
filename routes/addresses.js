const express = require('express');
const router = express.Router();
const db = require('../config/db');
const Joi = require('joi');

// 1. Esquema de Validación (El "Escudo")
const addressSchema = Joi.object({
    user_id: Joi.number().integer().required(),
    street: Joi.string().max(255).required(),
    city: Joi.string().max(100).required(),
    province: Joi.string().max(100).default('BC'),
    postal_code: Joi.string().max(20).required(),
    country: Joi.string().max(100).default('Canada')
});

// 2. Esquema para Actualizaciones (Todo es opcional menos el user_id)
const updateAddressSchema = Joi.object({
    user_id: Joi.number().integer().required(),
    street: Joi.string().max(255),
    city: Joi.string().max(100),
    province: Joi.string().max(100),
    postal_code: Joi.string().max(20),
    country: Joi.string().max(100)
});

// POST - Crear Dirección
router.post('/', async (req, res) => {
    try {
        // Validación de Joi
        const { error, value } = addressSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { user_id, street, city, province, postal_code, country } = value;

        const query = `
            INSERT INTO addresses (user_id, street, city, province, postal_code, country) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.query(query, [user_id, street, city, province, postal_code, country]);

        res.status(201).json({ message: "Address created successfully!", addressId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: "Failed to create address" });
    }
});

// GET - Listar direcciones de un usuario
router.get('/', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id || isNaN(user_id)) return res.status(400).json({ error: "Valid user_id is required" });

        const [rows] = await db.query('SELECT * FROM addresses WHERE user_id = ?', [user_id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error fetching addresses" });
    }
});

// PATCH - Actualización segura
router.patch('/:id', async (req, res) => {
    try {
        const addressId = req.params.id;
        const { error, value } = updateAddressSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { user_id, street, city, province, postal_code, country } = value;

        // Verificar propiedad antes de editar
        const [exists] = await db.query('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [addressId, user_id]);
        if (exists.length === 0) return res.status(403).json({ error: "Unauthorized or address not found" });

        const addr = exists[0];
        const query = `
            UPDATE addresses 
            SET street = ?, city = ?, province = ?, postal_code = ?, country = ?
            WHERE id = ? AND user_id = ?
        `;
        
        await db.query(query, [
            street ?? addr.street, 
            city ?? addr.city, 
            province ?? addr.province, 
            postal_code ?? addr.postal_code, 
            country ?? addr.country, 
            addressId,
            user_id
        ]);

        res.json({ message: "Address updated successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Error updating address" });
    }
});

// DELETE - Borrado seguro
router.delete('/:id', async (req, res) => {
    try {
        const { user_id } = req.body;
        const addressId = req.params.id;

        if (!user_id) return res.status(400).json({ error: "user_id is required in body" });

        const [result] = await db.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [addressId, user_id]);

        if (result.affectedRows === 0) return res.status(403).json({ error: "Unauthorized or address not found" });

        res.json({ message: "Address deleted successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting address" });
    }
});

module.exports = router;