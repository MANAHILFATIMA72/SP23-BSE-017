const express = require('express');
const Product = require('../models/Products');
const Category = require('../models/Category');
const upload = require('../middleware/multer');
const jwt = require('jsonwebtoken');
const { optionalAuthenticateJWT, authorizeRole } = require('../middleware/auth');
const router = express.Router();

// Middleware to authenticate JWT and authorize admin role
function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        req.flash('error', 'Please log in to access this page.');
        return res.redirect('/login');
    }

    jwt.verify(token, process.env.JWT_SECRET || 'you_are_strong_enough', (err, user) => {
        if (err) {
            req.flash('error', 'Invalid or expired session. Please log in again.');
            return res.redirect('/login');
        }
        req.user = user;
        next();
    });
}

// Admin Dashboard Route (Protected)
router.get('/dashboard', authenticateToken, authorizeRole('admin'), async (req, res) => {
    res.render('admin/dashboard', {
        layout: "layouts/adminLayout",
        title: "Admin Dashboard",
        user: req.user,
        messages: req.flash(),
    });
});

// List Products (Protected)
router.get('/products', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const search = req.query.search || '';
        const categoryFilter = req.query.category || '';
        const sort = req.query.sort || 'createdAt';
        const order = req.query.order || 'asc';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const query = {};
        if (search) query.name = { $regex: search, $options: 'i' };
        if (categoryFilter) query.category = categoryFilter;

        const totalProducts = await Product.countDocuments(query);
        const products = await Product.find(query)
            .populate('category')
            .sort({ [sort]: order === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const categories = await Category.find();
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('admin/products', {
            layout: "layouts/adminLayout",
            products,
            categories,
            search,
            category: categoryFilter,
            sort,
            order,
            currentPage: page,
            totalPages,
            messages: req.flash(),
        });
    } catch (err) {
        console.error('Error fetching products:', err);
        req.flash('error', 'Failed to fetch products.');
        res.redirect('/admin/dashboard');
    }
});

// Create Product (Protected)
router.post('/products/create', authenticateToken, authorizeRole('admin'), upload.single('image'), async (req, res) => {
    try {
        const { name, price, description, category } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null;

        const categoryDoc = await Category.findById(category);
        if (!categoryDoc) {
            req.flash('error', 'Invalid category selected.');
            return res.redirect('/admin/products');
        }

        const product = new Product({ name, price, description, category, image });
        await product.save();
        req.flash('success', 'Product created successfully.');
        res.redirect('/admin/products');
    } catch (err) {
        console.error('Error saving product:', err);
        req.flash('error', 'Failed to create product.');
        res.redirect('/admin/products');
    }
});

// Edit Product (Protected)
router.post('/products/edit/:id', authenticateToken, authorizeRole('admin'), upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, description, category } = req.body;

        const categoryDoc = await Category.findById(category);
        if (!categoryDoc) {
            req.flash('error', 'Invalid category selected.');
            return res.redirect('/admin/products');
        }

        await Product.findByIdAndUpdate(id, { name, price, description, category });
        req.flash('success', 'Product updated successfully.');
        res.redirect('/admin/products');
    } catch (err) {
        console.error('Error editing product:', err);
        req.flash('error', 'Failed to update product.');
        res.redirect('/admin/products');
    }
});

// Delete Product (Protected)
router.get('/products/delete/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        await Product.findByIdAndDelete(id);
        req.flash('success', 'Product deleted successfully.');
        res.redirect('/admin/products');
    } catch (err) {
        console.error('Error deleting product:', err);
        req.flash('error', 'Failed to delete product.');
        res.redirect('/admin/products');
    }
});

// List Categories (Protected)
router.get('/categories', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('admin/categories', {
            layout: "layouts/adminLayout",
            categories,
            messages: req.flash(),
        });
    } catch (err) {
        console.error('Error fetching categories:', err);
        req.flash('error', 'Failed to fetch categories.');
        res.redirect('/admin/dashboard');
    }
});

// Create Category (Protected)
router.post('/categories/create', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            req.flash('error', 'Category name is required.');
            return res.redirect('/admin/categories');
        }

        const category = new Category({ name, description });
        await category.save();
        req.flash('success', 'Category created successfully.');
        res.redirect('/admin/categories');
    } catch (err) {
        console.error('Error creating category:', err);
        req.flash('error', 'Failed to create category.');
        res.redirect('/admin/categories');
    }
});

// Edit Category (Protected)
router.post('/categories/edit/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        if (!name) {
            req.flash('error', 'Category name is required.');
            return res.redirect('/admin/categories');
        }

        await Category.findByIdAndUpdate(id, { name, description });
        req.flash('success', 'Category updated successfully.');
        res.redirect('/admin/categories');
    } catch (err) {
        console.error('Error editing category:', err);
        req.flash('error', 'Failed to update category.');
        res.redirect('/admin/categories');
    }
});

// Delete Category (Protected)
router.get('/categories/delete/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        await Category.findByIdAndDelete(id);
        req.flash('success', 'Category deleted successfully.');
        res.redirect('/admin/categories');
    } catch (err) {
        console.error('Error deleting category:', err);
        req.flash('error', 'Failed to delete category.');
        res.redirect('/admin/categories');
    }
});

// Logout Route (Protected)
router.post('/logout', authenticateToken, (req, res) => {
    res.clearCookie('token').redirect('/');
});

module.exports = router;
