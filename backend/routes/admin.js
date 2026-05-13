const express = require('express');
const router = express.Router();
const { crearUsuario, getUsuarios } = require('../controllers/adminController');

router.post('/crear-usuario', crearUsuario);
router.get('/usuarios', getUsuarios);

module.exports = router;
