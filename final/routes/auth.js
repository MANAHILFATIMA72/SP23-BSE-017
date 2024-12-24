const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Register Route
router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('Email already registered.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: role || 'user',
        });

        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'you_are_strong_enough',
            { expiresIn: '1h' }
        );

        res.cookie('token', token, { httpOnly: true });
        res.redirect('/'); // Redirect to homepage
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).send('Error registering user');
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/login');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/login');
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'you_are_strong_enough',
            { expiresIn: '1h' }
        );

        res.cookie('token', token, { httpOnly: true });
        req.flash('success', 'Login successful');

        // Redirect based on role
        if (user.role === 'admin') {
            res.redirect('/admin/dashboard');
        } else {
            res.redirect('/');
        }
    } catch (err) {
        console.error('Error logging in:', err);
        req.flash('error', 'Error logging in');
        res.status(500).send('Error logging in');
    }
});

// Logout Route
router.post('/logout', (req, res) => {
    res.clearCookie('token').redirect('/');
});

module.exports = router;
