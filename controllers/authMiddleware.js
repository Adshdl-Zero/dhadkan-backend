const jwt = require('jsonwebtoken');
const responses = require('../utils/responses')
const User = require('../models/user');

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json(responses.error("No token provided."));
    }
    try {
        const decoded = jwt.verify(token.split(" ")[1], "sher");
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json(responses.error("Invalid token"));
        }
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json(responses.error("Invalid token."));
    }
};

module.exports = authMiddleware;
