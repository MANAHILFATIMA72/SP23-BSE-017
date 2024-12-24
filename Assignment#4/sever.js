const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');
const flash = require('connect-flash');
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
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secretKey',
    resave: false,
    saveUninitialized: true,
  })
);
app.use(flash()); // Place flash AFTER session

// Custom middleware to make flash messages available in all views
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

app.use('/uploads', express.static('public/uploads'));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', '/layouts/main');

// Import routes
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

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
  });
});

app.get('/login', (req, res) => {
  res.render('users/login', { layout: 'layouts/main', title: "Login" });
});

app.get('/signUp', (req, res) => {
  res.render('users/sign-up', { layout: 'layouts/main', title: "Sign-up" });
});

app.get('/search', (req, res) => {
  res.render('users/search', { layout: 'layouts/main', title: "Search" });
});

app.get('/about', (req, res) => {
  res.render('users/about-us', { layout: 'layouts/main', title: "About-us" });
});

app.get('/contact', (req, res) => {
  res.render('users/contact', { layout: 'layouts/main', title: "Location" });
});

app.get('/orderConfirmation', (req, res) => {
  res.render('users/orderConfirmation', { layout: 'layouts/main', title: "Location" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
