const { query } = require('../config/db');

const normalize = (text) => {
    return text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
};

const verifyIngredients = async (ingredientsList) => {
    const flagged = [];
    const normalizedIngredients = ingredientsList.map(i => normalize(i)); // Keep somewhat original for display, but normalize for check? 
    // actually, let's normalize the input for search, but return the original if finding a match is tricky.
    // For MVP, simplistic matching:

    if (normalizedIngredients.length === 0) return [];

    // Fetch all banned substances (for MVP, caching this would be better)
    const result = await query('SELECT name, source, details FROM ingredients WHERE is_banned = TRUE');
    const bannedSubstances = result.rows;

    for (const ingredient of ingredientsList) {
        const cleanName = normalize(ingredient);

        // Exact match check (can be improved with fuzzy match later)
        const match = bannedSubstances.find(b => normalize(b.name) === cleanName);

        if (match) {
            flagged.push({
                ingredient: ingredient,
                reason: match.details,
                source: match.source
            });
        }
    }

    return flagged;
};

module.exports = { verifyIngredients };
