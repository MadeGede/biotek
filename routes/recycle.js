const express = require('express');
const router = express.Router();
const RecycleController = require('../controllers/RecycleController');
router.get('/', RecycleController.index);
router.get('/form', RecycleController.getForm);
router.post('/form', RecycleController.postForm);
router.get('/tracking', RecycleController.tracking);
module.exports = router;
