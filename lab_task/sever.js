const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const adminRoutes = require('./routes/admin');
const expressLayouts = require('express-ejs-layouts');

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
app.use('/uploads', express.static('public/uploads'));
app.use(
  session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: true,
  })
);

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts); // Use express-ejs-layouts for layout support

app.set('layout', 'admin/layout');


// Routes
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
  res.render('users/index', { layout: 'layouts/homeLayout', title: "Charcoal Clothing | Best Men's Formal &amp; Casual Wear Brand" });
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
