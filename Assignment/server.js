const express = require('express');
const app = express();
const path = require('path');
var expressLayouts = require("express-ejs-layouts");
// const { title } = require('node:process');

app.set('views', path.join(__dirname, 'views'));

app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(expressLayouts);
app.get('/', (req, res) => {
    res.render('index', { layout: 'layouts/homeLayout', title: "Charcoal Clothing | Best Men's Formal &amp; Casual Wear Brand" });
});

app.get('/login', (req, res) => {
    res.render('login', { layout: 'layouts/main', title: "Login" });
});

app.get('/signUp', (req, res) => {
    res.render('sign-up', { layout: 'layouts/main', title: "Sign-up" });
});

app.get('/search', (req, res) => {
    res.render('search', { layout: 'layouts/main', title: "Search" });
});

app.get('/about', (req, res) => {
    res.render('about-us', { layout: 'layouts/main', title: "About-us" });
});

app.get('/contact', (req, res) => {
    res.render('contact', { layout: 'layouts/main', title: "Location" });
});

app.listen(3000, () => {
    console.log(`Server is running at http://localhost:3000`);
});