const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');

// Product APIs
router.post('/', auth, productController.addProduct);          // Add a product
router.patch('/:id', auth, productController.updateProduct);   // Update a product (partial)
router.put('/:id', auth, productController.updateProduct);     // Update a product (full)
router.delete('/:id', auth, productController.deleteProduct);  // Delete a product

module.exports = router;
