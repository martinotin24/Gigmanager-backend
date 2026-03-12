const express = require('express');
const cors = require('cors');
const db = require('./config/db'); 

// IMPORT ROUTES
const usersRoute = require('./routes/users'); 
const clientsRoute = require('./routes/clients');
const gigRoutes = require('./routes/gigs');
const quoteRoutes = require('./routes/quotes');
const invoiceRoutes = require('./routes/invoices');
const addressesRoute = require('./routes/addresses');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); 

// ENDPOINTS DEFINITIONS
app.use('/api/v1/users', usersRoute); 
app.use('/api/v1/clients', clientsRoute);
app.use('/api/v1/gigs', gigRoutes);
app.use('/api/v1/quotes', quoteRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/addresses', addressesRoute);

// TEST CONNECTION 
app.get('/api/v1', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS solution');
        res.json({ 
            message: "Welcome to the GigManager API!",
            database_status: "Connected",
            test_query_result: rows[0].solution
        });
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: "Database connection failed." });
    }
});

// PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 GigManager Server running on http://localhost:${PORT}`);
});