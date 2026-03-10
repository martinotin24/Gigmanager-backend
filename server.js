const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json()); 

app.get('/api/v1', (req, res) => {
    res.json({ message: "¡Welcome to Gigmanager API!" });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});