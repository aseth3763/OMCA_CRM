const permissionModel = require('../model/permissionModel');

const role_Check = (requiredEndpoint) => async (req, res, next) => {
    try {
        const userRole = req.user.role; 
        const permission = await permissionModel.findOne({ role: userRole });         

            
        if (permission.permissions.get(requiredEndpoint) === 0) {
            return res.status(400).json({
                success: false,
                message: `Dear user, You are not authorized to access this section!`,
            });
        }
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
};

module.exports = role_Check;
