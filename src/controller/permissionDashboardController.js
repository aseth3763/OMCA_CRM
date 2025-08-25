const PermissionDashboardModel = require('../model/perimissionDashboardModel')



const add_Dashboard_endPoints = async (req, res) => {
  try {
    const { endpoints } = req.body; 

    // Define the roles and their permissions
    const roles = ['Admin', 'Receptionist' , 'Manager', 'Finance', 'Coordinator'];

    for (const role of roles) {
      const existingPermission = await PermissionDashboardModel.findOne({ role });

      if (!existingPermission) {
        // Agar pehli baar role add ho raha hai
        const permissions = {};
        endpoints.forEach(endpoint => {
          permissions[endpoint] = 1;
        });
        await PermissionDashboardModel.create({ role, permissions });
      } else {
        // Purane permissions ko plain object me convert karo
        const updatedPermissions = existingPermission.permissions.toObject
          ? existingPermission.permissions.toObject()
          : { ...existingPermission.permissions };

        // Sirf naye endpoints add karo
        endpoints.forEach(endpoint => {
          if (!(endpoint in updatedPermissions)) {
            updatedPermissions[endpoint] = 1;
          }
        });

        await PermissionDashboardModel.updateOne(
          { role },
          { $set: { permissions: updatedPermissions } }
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

const updateDashboardPermission = async (req, res) => {
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

            let permissionRecord = await PermissionDashboardModel.findOne({ role });

            if (!permissionRecord) {
               
                permissionRecord = new PermissionDashboardModel({
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

const get_all_dashboard_endPoints = async (req, res) => {
    try {
        const allend_points = await PermissionDashboardModel
            .find({ role: { $ne: "Admin" } })
            .sort({ createdAt: -1 })
            .lean();

        if (!allend_points || allend_points.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No end points found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'ALL end points',
            endPoints: allend_points.map((e) => {
                // Copy permissions without unwanted keys
                const { "/Manage_Permissions": _, "/Dashboard": __, ...filteredPermissions } = e.permissions;

                return {
                    Id: e._id,
                    role: e.role,
                    permissions: filteredPermissions
                };
            })
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error_message: error.message
        });
    }
};


    

module.exports = { add_Dashboard_endPoints , updateDashboardPermission  , get_all_dashboard_endPoints  }