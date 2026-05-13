const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getResidentes, crearResidente, eliminarResidente } = require('../controllers/residenteController');

router.use(protect);

router.get('/:userId', getResidentes);
router.post('/:userId', crearResidente);
router.delete('/:residenteId', eliminarResidente);

module.exports = router;
