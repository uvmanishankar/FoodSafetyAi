const express = require('express');
const router = express.Router();
const { verifyIngredients } = require('../services/ingredientService');

// POST /api/verify
// Body: { ingredients: ["Sugar", "Water", "D-ribose"] }
router.post('/', async (req, res) => {
    try {
        const { ingredients } = req.body;
        if (!ingredients || !Array.isArray(ingredients)) {
            return res.status(400).json({ error: 'Invalid input. Expecting an array of ingredients.' });
        }

        const flagged = await verifyIngredients(ingredients);
        res.json({ flagged, all_good: flagged.length === 0 });
    } catch (err) {
        console.error('Verification error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
