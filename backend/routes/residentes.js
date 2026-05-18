const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { joinResidente, getResidentes, crearResidente, eliminarResidente } = require('../controllers/residenteController');

// Público — el residente se registra con el código del dueño
router.post('/join', joinResidente);

router.use(protect);

router.get('/:userId', getResidentes);
router.post('/:userId', crearResidente);
router.delete('/:residenteId', eliminarResidente);

module.exports = router;
