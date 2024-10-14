const API_BASE_URL = 'http://localhost:3001';

const express = require('express');
const router = express.Router();

// import template from '../templates/example.marko'
const template = require('../templates/example.marko');
// Define your routes here
router.get(`$API_BASE_URL/api/hello`, (req, res) => {
    res.json({ message: 'Hello from the server!' });
});

router.get(`$API_BASE_URL/api/users`, (req, res) => {
    // This is just an example, replace with your actual data or database query
    res.json([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
    ]);
});

// Add more routes as needed

module.exports = router;