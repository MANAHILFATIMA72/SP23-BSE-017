const express = require('express');
const router = express.Router();
const { registerUser,
     loginUser,
     forgotPassword,
     resetPassword,
     refreshToken, 
     logoutUser,
     updateProfile } = require('../Controller/userController');
const { authenticate } = require('../middleware/auth');

const { verifyRefreshToken } = require("../middleware/auth");

// API endpoints
router.post('/register',registerUser);
router.post('/login', loginUser);
router.post('/forgot-password',forgotPassword);
router.post('/reset-password', resetPassword);
router.get("/refresh-token", refreshToken);
router.get("/logout", logoutUser);
router.get('/passwordResetSent', (req, res) => {
    res.render('users/passwordResetSent', { layout: 'layouts/main' });
});

router.post('/profile/:id',updateProfile);

module.exports = router;
