const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth'); // <-- import your auth.js


// Create user
router.post('/', userController.createUser);
// Public route: Login
router.post('/login', userController.loginUser);

// Get user by email
router.get('/:email',auth, userController.getUser);

// Update user by email
router.put('/:email', auth,userController.updateUser);   // full update
router.patch('/:email', auth,userController.updateUser); // partial update

module.exports = router;
