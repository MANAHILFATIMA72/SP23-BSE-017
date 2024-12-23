const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');
const flash = require('connect-flash');
const adminRoutes = require('./routes/admin');
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/adminPanelDB')
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Set up express app
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(flash());
app.use('/uploads', express.static('public/uploads'));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secretKey',
    resave: false,
    saveUninitialized: true,
  })
);

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', '/layouts/main');

// Import routes
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/auth');

// Use routes
app.use('/', productRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Middleware for optional authentication
const { optionalAuthenticateJWT } = require('./middleware/auth');

// Routes
app.get('/', optionalAuthenticateJWT, (req, res) => {
  if (req.user) {
    if (req.user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    }
  }
  res.render('users/index', { 
    layout: 'layouts/homeLayout',
    title: "Charcoal Clothing | Best Men's Formal &amp; Casual Wear Brand",
    messages: req.flash() 
  });
});

app.get('/login', (req, res) => {
  res.render('users/login', { layout: 'layouts/main', title: "Login", messages: req.flash() });
});

app.get('/signUp', (req, res) => {
  res.render('users/sign-up', { layout: 'layouts/main', title: "Sign-up", messages: req.flash() });
});

app.get('/search', (req, res) => {
  res.render('users/search', { layout: 'layouts/main', title: "Search", messages: req.flash() });
});

app.get('/about', (req, res) => {
  res.render('users/about-us', { layout: 'layouts/main', title: "About-us", messages: req.flash() });
});

app.get('/contact', (req, res) => {
  res.render('users/contact', { layout: 'layouts/main', title: "Location", messages: req.flash() });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
