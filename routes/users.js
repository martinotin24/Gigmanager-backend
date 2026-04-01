const express = require('express');
const router = express.Router();
const db = require('../config/db');
const Joi = require('joi'); // La armadura de datos

// 1. Esquema de Validación (El Escudo para el Registro)
const userSchema = Joi.object({
    firebase_uid: Joi.string().max(128).required(), // Coincide con tu VARCHAR(128)
    email: Joi.string().email().max(100).required(),
    full_name: Joi.string().max(100).allow(null, '')
});

// POST - Vincular Usuario con Firebase
router.post('/', async (req, res) => {
    try {
        // 1. BLINDAJE: Validar que los datos no sean maliciosos o incompletos
        const { error, value } = userSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({ 
                error: `Validation Error: ${error.details[0].message}` 
            });
        }

        const { firebase_uid, email, full_name } = value;

        // 2. PREPARED STATEMENTS: Evitar SQL Injection usando "?"
        const query = 'INSERT INTO users (firebase_uid, email, full_name) VALUES (?, ?, ?)';
        
        const [result] = await db.query(query, [firebase_uid, email, full_name]);

        res.status(201).json({ 
            message: "User profile linked with Firebase successfully!", 
            userId: result.insertId 
        });

    } catch (error) {
        // 3. MANEJO DE ERRORES SEGURO: No revelar detalles técnicos al usuario
        console.error("Database Error:", error.message);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Email or Firebase UID already exists." });
        }
        
        res.status(500).json({ error: "Failed to link user profile." });
    }
});

module.exports = router;