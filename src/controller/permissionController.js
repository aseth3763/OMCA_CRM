const permissionModel = require('../model/permissionModel')



const add_endPoints = async (req, res) => {
    try {
        const { endpoints } = req.body; 

        // Define the roles and their permissions
        const roles = ['Admin', 'Receptionist' , 'Manager'];

        for (const role of roles) {
            const permissions = {};

            // Add or update permission for each endpoint (1)
            endpoints.forEach(endpoint => {
                permissions[endpoint] = permissions[endpoint] || 1;
            });

            // Insert or update the permission
            const existingPermission = await permissionModel.findOne({ role });

            if (!existingPermission) {
                // If no existing permission found, create new
                await permissionModel.create({ role, permissions });
            } else {
                // If permission exists, update it
                await permissionModel.updateOne(
                    { role },
                    { $set: { permissions } }
                );
            }
        }

        res.status(200).json({
            success: true,
            message: 'endPoints added successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to add/update permissions',
            error: error.message,
        });
    }
};



// Api for update permission

const updatePermission = async (req, res) => {
    try {
        const { permissions } = req.body;

        if (!Array.isArray(permissions)) {
            return res.status(400).json({
                success: false,
                message: "'permissions' should be an array of objects.",
            });
        }

        for (const permission of permissions) {
            const { role, endpoint, allow } = permission;

            if (!role || !endpoint || allow === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Each permission object must include 'role', 'endpoint', and 'allow'.",
                });
            }

            let permissionRecord = await permissionModel.findOne({ role });

            if (!permissionRecord) {
               
                permissionRecord = new permissionModel({
                    role,
                    permissions: {},
                });
            }

            // Update or add the endpoint permission
            permissionRecord.permissions.set(endpoint, allow);

            // Save the updated permission record
            await permissionRecord.save();
        }

        res.status(200).json({
            success: true,
            message: "Successfully updated permissions for all specified roles!",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error.",
            error_message: error.message,
        });
    }
};



// Api for get endpoints according to role

const get_all_endPoints = async( req , res)=> {
            try {
                    const allend_points = await permissionModel.find({ }).sort({ createdAt  : -1 }).lean()
                    if(!allend_points)
                    {
                        return res.status(400).json({
                              success : false ,
                              message : 'No end points found'
                        })
                    }

                      return res.status(200).json({
                           success : true ,
                           message : 'ALL end points',
                           endPoints : allend_points.map((e)=> ({
                                  Id : e._id,
                                  role : e.role,
                                  permissions : e.permissions
                           }))
                      })
                       
            } catch (error) {
                  return res.status(500).json({
                       success : false ,
                       message : 'Server error',
                       error_message : error.message
                  })
            }
}

    

module.exports = { add_endPoints , updatePermission  , get_all_endPoints  }