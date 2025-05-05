const express = require('express')
const router = express.Router()
const permissionDashboardController = require('../controller/permissionDashboardController')

// Api for add endPoints

router.post('/add_Dashboard_endPoints', permissionDashboardController.add_Dashboard_endPoints);
// Api for update endpoints and give permission

router.post('/updateDashboardPermission', permissionDashboardController.updateDashboardPermission)

// Api for get_all_endPoints
router.get('/get_all_dashboard_endPoints', permissionDashboardController.get_all_dashboard_endPoints)



module.exports = router