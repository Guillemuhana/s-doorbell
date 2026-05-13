const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getUnidades, crearUnidad, actualizarUnidad, eliminarUnidad } = require('../controllers/unidadController');

router.use(protect);

router.get('/:userId', getUnidades);
router.post('/:userId', crearUnidad);
router.put('/:unidadId', actualizarUnidad);
router.delete('/:unidadId', eliminarUnidad);

module.exports = router;
