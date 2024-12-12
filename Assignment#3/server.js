const express = require('express');
const app = express();
var expressLayouts = require("express-ejs-layouts");

app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(expressLayouts);
app.get("/", (req, res) => {
    res.render("index");
});
app.listen(3000, () => {
    console.log(`Server is running at http://localhost:3000`);
});