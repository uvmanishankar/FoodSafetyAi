require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Food Safety Platform API Running');
});

const verifyRoutes = require('./routes/verify');
const labRoutes = require('./routes/labs');
app.use('/api/verify', verifyRoutes);
app.use('/api/labs', labRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
