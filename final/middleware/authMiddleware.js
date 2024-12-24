const jwt = require('jsonwebtoken');

// Authentication Middleware
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token; // Retrieve the token from cookies

    // Unprotected routes that do not require authentication
    const unprotectedRoutes = ['/auth/login', '/auth/sign-up'];

    // Allow access to unprotected routes
    if (unprotectedRoutes.includes(req.path)) {
        return next();
    }

    // If no token is found, redirect to login
    if (!token) {
        return res.redirect('/auth/login');
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, 'secret');
        req.user = decoded; // Attach the decoded user data to the request object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        // If the token is invalid or expired
        res.clearCookie('token'); // Clear the token cookie
        return res.status(401).render('auth/login', { error: 'Invalid or expired session' }); // Render the login page with an error message
    }
};

module.exports = authMiddleware;
