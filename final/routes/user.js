const express = require('express');
const { SignUp } = require('../controllers/user');
const router = express.Router();

router.post('/SignUp', SignUp);

module.exports = router;