const express = require('express');
const router = express.Router();
const HomeController = require('../controllers/HomeController');
router.get('/', HomeController.home);
router.get('/about', HomeController.about);
router.get('/contact', HomeController.contact);
router.post('/contact', HomeController.postContact);
module.exports = router;
