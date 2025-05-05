const express = require('express')
const router = express.Router()
const permissionController = require('../controller/permissionController')

// Api for add endPoints

router.post('/add_endPoints', permissionController.add_endPoints);
// Api for update endpoints and give permission

router.post('/updatePermission', permissionController.updatePermission)

// Api for get_all_endPoints
router.get('/get_all_endPoints', permissionController.get_all_endPoints)



module.exports = router