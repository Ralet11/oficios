const express = require('express');
const { asyncHandler } = require('../utils/async-handler');
const controller = require('../controllers/categories-controller');

const router = express.Router();

router.get('/', asyncHandler(controller.listCategories));

module.exports = router;
