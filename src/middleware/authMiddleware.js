const jwt = require('jsonwebtoken');

const { isTokenBlacklisted } = require('../middleware/blacklistToken');


const authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token){
        return res.status(400).json({
              success : false ,
              message: 'Unauthorized' 
            });
    } 

    if (isTokenBlacklisted(token)) 
        {
        return res.status(400).json({
              success : false,
              message: 'Token has been invalidated'
             });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
             // current date and time
             const currentDate = new Date()
             const currentDateString = currentDate.toISOString().split('T')[0]
             const currentTimeString = currentDate.toTimeString().split(' ')[0]

             if (
                decoded.expireDate < currentDateString ||
                (decoded.expireDate === currentDateString && decoded.expireTime <= currentTimeString)
              ) 
              {
                return res.status(400).json({
                       success : false ,
                       message : 'Unauthorized'
                })
              }
             req.user = decoded;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Invalid Token' });
    }
};

module.exports = authenticate;