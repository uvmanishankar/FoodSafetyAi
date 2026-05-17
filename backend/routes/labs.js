const express = require('express');
const router = express.Router();

// GET /api/labs?lat=...&lng=...
router.get('/', (req, res) => {
    // For MVP, return static mock data
    // In real app, query database with geospatial logic or use Google Maps API
    const mockLabs = [
        {
            id: 1,
            name: "National Food Testing Laboratory",
            address: "123 Science Park, New Delhi",
            contact: "+91-11-23456789",
            lat: 28.6139,
            lng: 77.2090,
            accreditation: "NABL Accredited"
        },
        {
            id: 2,
            name: "SafeFood Analytics",
            address: "45 Quality Road, Mumbai",
            contact: "+91-22-98765432",
            lat: 19.0760,
            lng: 72.8777,
            accreditation: "FSSAI Recognized"
        },
        {
            id: 3,
            name: "Bangalore Food Safety Lab",
            address: "88 Tech Hub, Bangalore",
            contact: "+91-80-11223344",
            lat: 12.9716,
            lng: 77.5946,
            accreditation: "ISO 17025"
        }
    ];

    res.json(mockLabs);
});

module.exports = router;
