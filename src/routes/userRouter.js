const express = require('express')
const router = express.Router()
const upload = require('../../upload')
const userController = require('../controller/userController')
const authenticate = require('../middleware/authMiddleware')
const roleCheck = require('../middleware/role_auth')
const dynamicRoleCheck = require('../middleware/role_auth');

                                                         /* user section */                   

    // Api for add_staff_user

    router.post('/add_staff_user', authenticate, roleCheck('/add_staff_user'), upload.single('profileImage'), userController.add_staff_user)
    // Api for login
    router.post('/login', userController.login)
    // Api for get_all_user_staffs
    router.get('/get_all_user_staffs', authenticate, roleCheck('/get_all_user_staffs'),  userController.get_all_user_staffs)
    // Api for get_details
    router.get('/get_details/:userId',authenticate, roleCheck('/get_details'), userController.get_details)
    // Api for update_details
    
    // Api for delete_staff_user
    router.delete('/delete_user_staff/:userId', authenticate, roleCheck('/delete_user_staff'), userController.delete_user_staff)

    router.put('/update_details/:userId', authenticate, roleCheck('/update_details'), upload.single('profileImage'), userController.update_details)
    // Api for change_user_password
    router.post('/change_user_password/:userId', authenticate, roleCheck('/change_user_password'), userController.change_user_password)
    router.post("/add_notes/:enquiryId",userController.add_notes)
    
    // Routes
    router.post('/staff_forget_pass_otp',   userController.staff_forget_pass_otp);
    router.post('/staff_verify_otp',  userController.staff_verify_otp);
    router.post('/staff_reset_password/:userId',userController.staff_reset_password);
    // Api for active_inactive_staff_user
    router.post('/active_inactive_staff_user/:staff_user_id',   userController.active_inactive_staff_user)
    // Api for logout
    router.post('/logout', userController.logout)
    // Api for refreshToken
    router.post('/refreshToken', userController.refreshToken)
    
    router.post('/addCountry',authenticate, roleCheck('/addCountry'), userController.addCountry)
    router.get('/getCountries',authenticate, roleCheck('/getCountries'), userController.getCountries)

    router.put('/editCountry/:id', authenticate, roleCheck('/editCountry'), userController.editCountry)
    router.delete('/deleteCountry/:id', authenticate, roleCheck('/deleteCountry'), userController.deleteCountry)
    router.put('/changeCountryStatus/:id',authenticate,roleCheck('/changeCountryStatus'),userController.changeCountryStatus);
    router.get('/getActiveCountries',authenticate,roleCheck('/getActiveCountries'),userController.getActiveCountries);
    

                                               /* Hospital Section */

    router.post('/add_hospital', authenticate, roleCheck('/add_hospital'),upload.single('hospitalImage'), userController.add_hospital)
    // Api for getAll_hospital
    router.get('/getAll_hospital', authenticate, roleCheck('/getAll_hospital'), userController.getAll_hospital)
    // Api for update_Hospital_Details
    router.put('/update_Hospital_Details/:hospitalId', authenticate, roleCheck('/update_Hospital_Details'), upload.single('hospitalImage'), userController.update_Hospital_Details)
    // Api for delete_hospital
    router.delete('/delete_hospital/:hospitalId', authenticate, roleCheck('/delete_hospital'), userController.delete_hospital)

                                                  /* Enquiry Section */

             // Api for add new Enquiry
    router.post('/add_new_enq/:userId', authenticate, roleCheck('/add_new_enq'),  userController.add_new_enq)
    // Api for all_Enq
    router.get('/all_Enq', authenticate , roleCheck('/all_Enq') , userController.all_Enq)
    // Api for get_Enq
    router.get('/get_Enq/:enquiryId' , authenticate , roleCheck('/get_Enq') , userController.get_Enq)
    // Api for update Enquiry
     router.put('/update_enq/:enquiryId' , authenticate , roleCheck('/update_enq') , userController.update_enq)
     // Api for update_Enquiry_status
     router.delete('/deleteEnquiry/:enquiryId' ,authenticate , roleCheck('/deleteEnquiry') , userController.deleteEnquiry)
     router.post('/update_Enquiry_status/:enquiryId' , authenticate , roleCheck('/update_Enquiry_status') , userController.update_Enquiry_status)
     router.get("/getOldEnquiryHistory",authenticate, roleCheck('/getOldEnquiryHistory'),userController.getOldEnquiryHistory);

                                                  /* Patient Section */
   
    // Api for all_patients
    router.get('/all_patients' , authenticate, roleCheck('/all_patients'), userController.all_patients)
    // Api for deletePatient
    router.delete('/deletePatient/:patientId', authenticate, roleCheck('/deletePatient'), userController.deletePatient)
    router.get('/get_notes_by_patient/:patientId',authenticate, roleCheck('/get_notes_by_patient'), userController.get_notes_by_patient)
    // Api for generate_sampleFile
    router.get('/generate_sampleFile', userController.generate_sampleFile)
    // Api for import_file
    router.post('/import_file/:userId', authenticate, roleCheck('/import_file'), upload.single('file'),userController.import_file)
    // Api for get_patient
    router.get('/get_patient/:patientId' , authenticate, roleCheck('/get_patient'), userController.get_patient)
    // Api for update_patient
    router.put('/update_patient/:patientId', authenticate, roleCheck('/update_patient'),  userController.update_patient)
    // Api for assign_patient_to_hospital
    router.post('/assign_patient_to_hospital/:patientId' , authenticate , roleCheck('/assign_patient_to_hospital') , userController.assign_patient_to_hospital)
    // APi for update_patient_status
    router.post('/update_patient_status/:patientId' ,  userController.update_patient_status)
    // Api for add patient_Kyc_details
    router.post('/patient_Kyc_details/:patientId' , upload.fields([
        
        { name: 'id_proof', maxCount: 1 },
        { name: 'photo', maxCount: 1 },
        { name: 'passport', maxCount: 1 }]            
    ) , authenticate , roleCheck('/patient_Kyc_details') , userController.patient_Kyc_details)  
    // Api  for patient_extra_service
    router.post('/patient_extra_service/:treatment_id' , authenticate , roleCheck('/patient_extra_service') , userController.patient_extra_service)  

                                                             /* service section */

    router.post('/add_service' , authenticate, roleCheck('/add_service') , userController.add_service) 
    // Api for all_services
    router.get('/all_services', authenticate , roleCheck('/all_services') , userController.all_services)
    // Api for active_inactive_Service
    router.post('/active_inactive_Service/:serviceId' ,  userController.active_inactive_Service) 
    
    // Api for update service
    router.post('/update_service/:serviceId' , authenticate , roleCheck('/update_service') , userController.update_service) 
    
    // Api for delete_service
    router.delete('/`delete_service`/:serviceId' , authenticate , roleCheck('/delete_service') , userController.delete_service)
    
    // Api for paid service
    router.get('/paid_service' ,  userController.paid_service)
    
    // Api for get_activeServices
    router.get('/get_activeServices' , authenticate , roleCheck('/get_activeServices') , userController.get_activeServices)
    
    router.post('/add_free_service' , userController.add_free_service) 
    
                                      /* Appointment Section */


                                      
                                                  
    // Api for create Appointment
    router.post('/create_appointment/:userId', authenticate, roleCheck('/create_appointment'),  userController.create_appointment)
    // Api for all_appointment
    router.get('/all_appointment', authenticate, roleCheck('/all_appointment'), userController.all_appointment)
    // Api for get_patient_appointment
    router.get('/get_patient_appointment/:patientId', authenticate, roleCheck('/get_patient_appointment'), userController.get_patient_appointment)
    router.post('/update_appointment_status/:appointmentId', userController.update_appointment_status)

                                          /* treatment Course section */
    
     // Api for add_treatment_course
     router.post('/add_treatment_course', authenticate, roleCheck('/add_treatment_course'), userController.add_treatment_course)
     // Api for get_all_treatment_courses
     router.get('/get_all_treatment_courses', authenticate, roleCheck('/get_all_treatment_course'),  userController.get_all_treatment_courses)
     // Api for get_treatment_course by id
      router.get('/get_treatment_course_by_id/:treatment_course_id', userController.get_treatment_course_by_id)

     // Api for delete_treatment_course
     router.delete('/delete_treatment_course/:courseId', authenticate, roleCheck('/delete_treatment_coursel'), userController.delete_treatment_course )
     // Api for update_treatment_course_details
     router.put('/update_treatment_course/:treatment_course_id' , authenticate, roleCheck('/update_treatment_course') , userController.update_treatment_course  )
                                                               
                                          /* Report section */
     // Api for export_client_jobs_filteredpatient
     router.get('/exportfilteredpatient' ,  userController.exportfilteredpatient)
     // Api for patientCount_year_wise
     router.get('/patientCount_year_wise', userController.patientCount_year_wise )

                                                                  /* treatment section */

      // Api for create_treatment
      router.post('/create_treatment' , authenticate, roleCheck('/create_treatment') , userController.create_treatment)                
      // Api for get_patient_treatment
      router.get('/get_patient_treatment/:patientId' , authenticate , roleCheck('/get_patient_treatment') , userController.get_patient_treatment)          
      router.get('/get_unadded_services_for_treatment/:treatmentId' ,  userController.get_unadded_services_for_treatment)          
      // Api for update_patient_treatment_status
      router.post('/update_patient_treatment_status/:treatment_id' ,  userController.update_patient_treatment_status)                                  
       // Api for add_new_treatment_payment
       router.post('/add_new_treatment_payment/:treatment_id' , authenticate , roleCheck('/add_new_treatment_payment') , userController.add_new_treatment_payment)
       router.post('/update_treatment_status/:treatment_id', authenticate , roleCheck('/update_treatment_status') ,userController.update_treatment_status);

                                                                  /* Dashboard Count */

      router.get('/Dashboard_count', authenticate , roleCheck('/Dashboard_count') , userController.Dashboard_count)
      
                                                                 /* totalEarnings Count */
      // Api for totalEarnings
      router.get('/totalEarnings', authenticate , roleCheck('/totalEarnings') , userController.totalEarnings)
                        
                                                               /* user chat group */

        // Api for userChat
        router.post('/userChat/:userId' , upload.single('attachment') ,  userController.userChat)
        // Api for get_chats
        router.get('/get_chats', userController.get_chats)

        router.post("/getFilteredReports",authenticate , roleCheck('/getFilteredReports') ,userController.getFilteredReports);
        
        router.post("/addReports/:treatmentId",authenticate , roleCheck('/addReports'),upload.single('treatmentReport')  ,userController.addReports);
        
      module.exports = router

                                    