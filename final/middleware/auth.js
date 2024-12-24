const jwt = require('jsonwebtoken');

// Middleware to optionally authenticate users
function optionalAuthenticateJWT(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'you_are_strong_enough');
        req.user = verified;
    } catch (err) {
        req.user = null;
    }
    next();
}

// Middleware to authorize specific roles
function authorizeRole(role) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).send('Access Denied: Insufficient Privileges!');
        }
        next();
    };
}

module.exports = { optionalAuthenticateJWT, authorizeRole };
