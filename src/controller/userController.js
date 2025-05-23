const userModel = require('../model/userModel')
const bcrypt = require('bcryptjs')
const jwt =  require('jsonwebtoken')
const user_Email = require('../utils/userEmail')
const hospitalModel = require('../model/hospitalModel')
const patientModel = require('../model/patientModel')
const ExcelJs = require("exceljs");
const appointmentModel = require('../model/appointmentModel')
const perimissionDashboardModel = require("../model/perimissionDashboardModel")
const permissionModel = require('../model/permissionModel')
const otpModel = require("../model/otpModel")
const treatement_course_model = require('../model/treatment_course_Model')
const countryModel = require("../model/countryModel")
const { blacklistToken } = require('../middleware/blacklistToken');
const treatmentModel = require('../model/treatmentModel')
const enquiryModel = require('../model/enquiryModel')
const serviceModel = require('../model/serviceModel')
const mongoose = require('mongoose')
const chatModel = require('../model/chatModel')
const PermissionDashboardModel = require('../model/perimissionDashboardModel')
const freeServiceModel = require("../model/freeServiceModel")
const reportModel = require("../model/reportTreatmentModel")
const sendWhatsAppMessage = require("../utils/infobipWhatsApp")


                            /*  User section */

    // Api for add staff user

    const add_staff_user = async (req, res) => {
        try {
            const { name, email, phone_no, gender, role, password } = req.body;
            const requiredFields = ['name', 'email', 'phone_no', 'gender', 'role', 'password'];
    
            // Check for required fields
            for (let field of requiredFields) {
                if (!req.body[field]) {
                    return res.status(400).json({ success: false, message: `Required ${field.replace('_', ' ')}` });
                }
            }
    
            // Check if user already exists
            const exist_user = await userModel.findOne({ email });
            if (exist_user) {
                return res.status(400).json({ success: false, message: `User already exists with the email: ${email}` });
            }
    
            // Handle profile image if provided
            let profileImage = '';
            if (req.file) profileImage = req.file.filename;
    
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);  
           
    
            // Create new user
            const newUser = new userModel({
                name, email, gender, phone_no, role, password: hashedPassword, profileImage , userLogs : []
            });
    
           
            await newUser.save();
    
            return res.status(200).json({
                success: true,
                message: `${role} added successfully`,
                details: newUser
            });
    
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Server error',
                error_message: error.message
            });
        }
    };
    

    // Api for login
    const login = async (req, res) => {
      try {
          const { email, password } = req.body;
  
          if (!email) {
              return res.status(400).json({ success: false, message: 'Required Email' });
          }
          if (!password) {
              return res.status(400).json({ success: false, message: 'Password required' });
          }
  
          const user = await userModel.findOne({ email });
          if (!user) {
              return res.status(400).json({ success: false, message: 'User Not Found' });
          }
  
          const isPasswordMatch = await bcrypt.compare(password, user.password);
          if (!isPasswordMatch) {
              return res.status(400).json({ success: false, message: 'Password Incorrect' });
          }
  
          // Fetch role permissions
          const permissionData = await PermissionDashboardModel.findOne({ role: user.role });
  
          let allowedEndpoints = [];
          if (permissionData && permissionData.permissions instanceof Map) {
              // Convert Map to an array and filter endpoints where value is 1
              allowedEndpoints = [...permissionData.permissions.entries()]
                  .filter(([key, value]) => value === 1)
                  .map(([key]) => key);
          }
  
          console.log('Allowed Endpoints:', allowedEndpoints);
  
          const now = new Date();
          const token = jwt.sign(
              { id: user._id, role: user.role },
              process.env.JWT_SECRET,
              { expiresIn: '1d' }
          );
  
          const loginTime = now.toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
          });
  
          user.userLogs.push({ date: now, loginTime });
  
          if (user.userLogs.length >= 2) {
              let a = user.userLogs[user.userLogs.length - 2];
              let b = user.userLogs[user.userLogs.length - 1];
              if (a && b && a.logoutTime === '') {
                  a.logoutTime = `${b.loginTime} - ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
              }
          }
  
          await user.save();
          if(user.role === 'Admin'){
            
          }
          return res.status(200).json({
              success: true,
              message: `${user.role} login Successfully`,
              details: {
                  _id: user._id,
                  name: user.name,
                  email: user.email,
                  phone_no: user.phone_no,
                  profileImage: user.profileImage,
                  gender: user.gender,
                  role: user.role,
                  status: user.status,
                  userLogs: user.userLogs,  
              },
              token,
              loginTime,
              permissions: allowedEndpoints,  
          });
      } catch (error) {
          return res.status(500).json({ success: false, message: 'Server error', error_message: error.message });
      }
  };
  
  
  // Api for refresh token
       const refreshToken = async(req , res)=> {
        try {
          const token = req.body.token; 
          if (!token) {
            return res.status(400).json({ success: false, message: "No refresh token found" });
          }
      
          const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
          const user = await userModel.findById(decoded.id);
      
          if (!user || user.refreshToken !== token) {
            return res.status(400).json({ success: false, message: "Invalid refresh token" });
          }
      
          // Generate new access token
          const newAccessToken = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
          );
      
          return res.status(200).json({ success: true, accessToken: newAccessToken });
        } catch (error) {
          return res.status(500).json({ success: false, message: "Server error" , error_message : error.message });
        }
       }


  // Api for logout 
  const logout = async (req, res) => {
    try {
      const { token } = req.body; 

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const userId = decoded.id;
  
      // Find the user by ID
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'User Not Found',
        });
      }
  
      // Check if the user has any login logs
      if (user.userLogs.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No login logs found for this user',
        });
      }

      const latestLog = user.userLogs[0]; 
  
      // Add logout time to the latest log
      const now = new Date();
      const logoutTime = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
  
      latestLog.logoutTime = `${logoutTime} -${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`; 
  
      // Save the updated user document
      await user.save();
  
      // Respond with a success message
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
       
      });
    } catch (error) {                 
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error_message: error.message,
      });
    }
  };
    
    // Api for get all user staffs
        const get_all_user_staffs = async( req , res )=> {
               try {
                        const user_staff = await userModel.find({ role : { $ne :'Admin'} }).sort({ createdAt : -1 }).lean()
                        if(!user_staff)
                        {
                            return res.status(400).json({
                                   success : false ,
                                   message : 'No Staff Found'
                            })
                        }

                        return res.status(200).json({
                               success : true ,
                               message : 'All user Staff',
                               Details : user_staff
                        })                
               } catch (error) {
                    return res.status(500).json({
                           success : false ,
                           message : 'Server error',
                           error_message : error.message
                    })
               }
        }
                 

    // Api for get details
         const get_details = async ( req , res )=> {     
               try { 
                        const userId = req.params.userId
                        if(!userId)
                        {
                            return res.status(400).json({
                                  success : false ,
                                  message : 'User Id Required'
                            })
                        }

                          // check for user
                          const user = await userModel.findOne({ _id : userId })
                          if(!user)
                          {
                            return res.status(400).json({
                                   success : false ,
                                   message : `User Not Found`
                            })
                          }
                             
                              return res.status(200).json({
                                success : true ,
                                message : `${user.role} Detail`,
                                Details : {
                                  _id : user._id ,
                                  name : user.name,
                                  email : user.email,
                                  phone_no : user.phone_no,
                                  profileImage : user.profileImage ,
                                  gender : user.gender ,
                                  role : user.role ,
                                  password : user.password ,
                                  status : user.status,
                                  
                                  
                                }
                              }) 
                             

                        
               } catch (error) {
                   return res.status(500).json({
                        success : false ,
                        message : 'Server error',
                        error_message : error.message
                   })
               }
         }
             
    // Api for update details
        const update_details = async ( req , res )=> {
               try {
                    const { userId } = req.params
                    const { name , email , phone_no , gender } = req.body
                    // check for userId
                    if(!userId)
                        {
                              return res.status(400).json({
                                   success : false ,
                                   message : 'User Id Required'
                              })
                        }  

                    // check for user
                    const user = await userModel.findOne({ _id : userId })
                    if(!user)
                    {
                        return res.status(400).json({
                              success : false ,
                              message : 'User Not Found '
                        })
                    }

                       if(name)
                       {
                           user.name = name
                       }
                       
                       if(email)
                        {
                            user.email = email
                        }
                        
                       if(phone_no)
                        {
                            user.phone_no = phone_no
                        }
                        
                       if(gender)
                        {
                            user.gender = gender
                        }
                        if(req.file)
                        {
                             user.profileImage = req.file.filename
                        }

                        await user.save()

                        return res.status(200).json({
                              success : true ,
                              message : 'Details updated',
                              details : user
                        })
               } catch (error) {
                   return res.status(500).json({
                       success : false ,
                       message : 'Server error',
                       error_message : error.message
                   })
               }
        }

        // Api for delete user staff
        const delete_user_staff = async ( req , res )=> {
            try {
                const userId = req.params.userId
                // check for userId
                if(!userId)
                    {
                          return res.status(400).json({
                                success : false ,
                                message : 'User Id Required'
                          })
                    }
                    const user = await userModel.findOne({ _id : userId })
                    if(!user)
                    {
                        return res.status(400).json({
                              success : false ,
                              message : 'User Not Found '
                        })
                    }
                    if(user.role === 'Admin')
                    {
                        return res.status(400).json({
                              success : false ,
                              message : 'Admin User Cannot be deleted'
                        })
                    }

                    const delete_user = await userModel.deleteOne({ _id : userId })
                    if(!delete_user)
                    {
                        return res.status(400).json({
                              success : false ,
                              message : 'User Not Found '
                        })
                    }
                    return res.status(200).json({
                          success : true ,
                          message : 'User Deleted Successfully'
                    })
            } catch (error) {
                return res.status(500).json({
                      success : false ,
                      message : 'Server error',
                      error_message : error.message 
                })  
            }
        }

        // Api for change password

        const change_user_password = async (req, res) => {
            try {
              const userId  = req.params.userId ;
              const { oldPassword, newPassword, confirmPassword } = req.body;
          
              // Check for user ID
              if (!userId) {
                return res.status(400).json({
                  success: false,
                  message: 'userId is required',
                });
              }
          
              // Check if user exists
              const user = await userModel.findOne({ _id : userId });
              if (!user) {
                return res.status(400).json({
                  success: false,
                  message: 'user not found',
                });
              }
          
              // Validate required fields
              const requiredFields = ['oldPassword', 'newPassword', 'confirmPassword'];
              for (let field of requiredFields) {
                if (!req.body[field]) {
                  return res.status(400).json({
                    success: false,
                    message: `Required field ${field.replace("_", " ")} is missing`,
                  });
                }
              } 
          
              // Validate new password match
              if (newPassword !== confirmPassword) {
                return res.status(400).json({
                  success: false,
                  message: 'New password and confirm password do not match',
                });
              }
          
              // Validate old password
              const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
              if (!isOldPasswordValid) {
                return res.status(400).json({
                  success: false,
                  message: 'Old password is incorrect',
                });
              }
          
              if(newPassword === oldPassword) { 
                return res.status(400).json({
                  success: false,
                  message: 'New password cannot be the same as old password',
                });
              }

              // Hash the new password
              const hashedNewPassword = await bcrypt.hash(newPassword, 10);
          
              // Update the user's password
              user.password = hashedNewPassword;
          
              // Email content
              const emailContent = `
                <p style="text-align: center; font-size: 20px; color: #333; font-weight: 600; margin-bottom: 30px;">Congratulations! Your Password Has Been Changed</p>
                <p style="text-align: center; font-size: 16px; color: #666; margin-bottom: 20px;">Here are your updated account details:</p>
                <div style="display: flex; justify-content: center; align-items: center;">
                  <div style="width: auto; max-width: 500px; background-color: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1); padding: 20px;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr style="background-color: #fff;">
                        <td style="padding: 14px 20px; text-align: left; font-weight: 600; font-size: 16px; border-bottom: 1px solid #e0e0e0;">Email:</td>
                        <td style="padding: 14px 20px; text-align: left; font-size: 16px; border-bottom: 1px solid #e0e0e0;">${user.email}</td>
                      </tr>
                      <tr style="background-color: #fff;">
                        <td style="padding: 14px 20px; text-align: left; font-weight: 600; font-size: 16px; border-bottom: 1px solid #e0e0e0;">Phone No:</td>
                        <td style="padding: 14px 20px; text-align: left; font-size: 16px; border-bottom: 1px solid #e0e0e0;">${user.phone_no}</td>
                      </tr>
                      <tr style="background-color: #fff;">
                        <td style="padding: 14px 20px; text-align: left; font-weight: 600; font-size: 16px;">Password:</td>
                        <td style="padding: 14px 20px; text-align: left; font-size: 16px;">${newPassword}</td>
                      </tr>
                    </table>
                  </div>
                </div>
              `;
          
              // Send email to the user
              await user_Email(user.email, 'Password Changed Successfully', emailContent);
          
              // Save the updated user record
              await user.save();
          
              return res.status(200).json({
                success: true,
                message: 'Password changed successfully',
              });
            } catch (error) {
              return res.status(500).json({
                success: false,
                message: 'Server error',
                error_message: error.message,
              });
            }
          };

          // Api for forget Password

        const staff_forget_pass_otp = async (req, res) => {
            try {
                const { email } = req.body;
                if (!email || !isValidEmail(email)) {
                    return res.status(400).json({ success: false, message: "Valid email is required" });
                }
        
                const staff = await userModel.findOne({ email });
                if (!staff) {
                    return res.status(400).json({ success: false, message: "User not found" });
                }
        
                const otp = generateOTP();
                await otpModel.create({ userId: staff._id, otp });
        
                const emailContent =  `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                        .email-container { max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); }
                        .email-header { text-align: center; font-size: 20px; font-weight: bold; color: #333; padding-bottom: 10px; border-bottom: 2px solid #ddd; }
                        .email-content { padding: 20px 0; text-align: center; font-size: 16px; color: #555; }
                        .otp-code { font-size: 24px; font-weight: bold; color: #ff5722; background: #f8f8f8; padding: 10px; display: inline-block; border-radius: 5px; margin: 10px 0; }
                        .email-footer { text-align: center; font-size: 14px; color: #777; padding-top: 10px; border-top: 1px solid #ddd; }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <div class="email-header">
                            Password Reset OTP
                        </div>
                        <div class="email-content">
                            <p>Dear User,</p>
                            <p>Your One-Time Password (OTP) for password reset is:</p>
                            <div class="otp-code">${otp}</div>
                            <p>This OTP is valid for <b>2 minutes</b>. Do not share it with anyone.</p>
                        </div>
                        <div class="email-footer">
                            If you did not request this, please ignore this email.<br>
                            &copy; 2025 Your Company Name
                        </div>
                    </div>
                </body>
                </html>`;;
                await user_Email(staff.email, "Password Reset OTP", emailContent);
        
                res.status(200).json({ success: true, message: "OTP sent to email",data : staff.email });
            } catch (error) {
                res.status(500).json({ success: false, message: "Server error", error_message: error.message });
            }
        };
        
        const staff_verify_otp = async (req, res) => {
            try {
                const { otp } = req.body;
                if (!otp) return res.status(400).json({ success: false, message: "OTP is required" });
        
                const userOTP = await otpModel.findOne({ otp });
                if (!userOTP) return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        
                res.status(200).json({ success: true, message: "OTP verified", userId: userOTP.userId });
            } catch (error) {
                res.status(500).json({ success: false, message: "Server error", error_message: error.message });
            }
        };
        
        const staff_reset_password = async (req, res) => {
            try {
                const { password, confirmPassword } = req.body;
                const userId = req.params.userId;
        
                if (!password || !confirmPassword) {
                    return res.status(400).json({ success: false, message: "Both password fields are required" });
                }
                if (password !== confirmPassword) {
                    return res.status(400).json({ success: false, message: "Passwords do not match" });
                }
        
                const staff = await userModel.findById(userId);
                if (!staff) return res.status(400).json({ success: false, message: "Invalid user" });
                
                const matchOldPassword = await bcrypt.compare(password,staff.password)
                if(matchOldPassword){
                  return res.status(400).json({
                    success : false,
                    message : "Old password and New password can not be same"
                  })
                }

                staff.password = await bcrypt.hash(password, 10);
                await staff.save();
                await otpModel.deleteOne({ userId });
        
                res.status(200).json({ success: true, message: "Password reset successfully" });
            } catch (error) {
                res.status(500).json({ success: false, message: "Server error", error_message: error.message });
            }
        };
        
        function isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }
        
        function generateOTP() {
            return Math.floor(1000 + Math.random() * 9000).toString();
        }

        // Api for Countries
        
        const addCountry = async (req,res)=>{
          try {
            let {countryName,countryCode,phoneCode} = req.body
            if(!countryName){
              return res.status(400).json({
                success : false,
                message : "country name is required",
              })
            }
          
            if(!phoneCode){
              return res.status(400).json({
                success : false,
                message : "phone code is required",
              })
            }
            if(!countryCode){
              return res.status(400).json({
                success : false,
                message : "Country code is required",
              })
            }
            
            const existingData = await countryModel.findOne({
              countryName
            })

            if(existingData){
              return res.status(400).json({
                success : false,
                message : "Country already exist"
              })
            }

            const countryData = new countryModel({
              countryName,countryCode,phoneCode
            })
      
            await countryData.save()
            return res.status(200).json({
              success : true,
              message : "Country Data added successfully",
              data :countryData
            })
          } catch (error) {
            return res.status(500).json({
              success : false,
              message : "Internal Server Error",
              error : error.message
            })
          }
        }

        const getCountries = async(req,res)=>{
          try {
            const countriesData = await countryModel.find()
            if(!countriesData || countriesData.length ===0){
              return res.status(400).json({
                success : false,
                message : "No any country data found",
              })        
            }
            return res.status(200).json({
              success : false,
              message : "All countries data fetched successfully",
              data : countriesData
            })        
          } catch (error) {
            return res.status(500).json({
              success : false,
              message : "Internal Server Error",
              error : error.message
            })          }
        }

        const editCountry = async (req, res) => {
          try {
            const { id } = req.params;
            const { countryName, countryCode ,phoneCode} = req.body;
        
            // Validate country ID
            if (!id) {
              return res.status(400).json({
                success: false,
                message: 'Country ID is required',
              });
            }
        
            // Find the country by ID
            const country = await countryModel.findById(id);
            if (!country) {
              return res.status(404).json({
                success: false,
                message: 'Country not found',
              });
            }
        console.log(country);
        
            // Update fields if provided
            if (countryName)
              { country.name = countryName

                console.log(country.name)
              };
            if (countryCode){ country.code = countryCode};
            if (phoneCode) {country.dial_code = phoneCode};
        
            await country.save();
            console.log(country)
            return res.status(200).json({
              success: true,
              message: 'Country details updated successfully',
              data: country
            });
        
          } catch (error) {
            return res.status(500).json({
              success: false,
              message: 'Internal server error',
              error: error.message,
            });
          }
        };
        
        
        const deleteCountry = async (req, res) => {
          try {
            const { id } = req.params;
        
            const deletedData = await countryModel.findByIdAndDelete(id);
        
            if (!deletedData) {
              return res.status(404).json({
                success: false,
                message: "Country not found",
              });
            }
        
            return res.status(200).json({
              success: true,
              message: "Country deleted successfully",
            });
          } catch (error) {
            return res.status(500).json({
              success: false,
              message: "Internal Server Error",
              error: error.message,
            });
          }
        };

        const changeCountryStatus = async (req, res) => {
          try {
            const { id } = req.params;
            const { status } = req.body;
        
            if (!status) {
              return res.status(400).json({
                success: false,
                message: "Status is required",
              });
            }
        
            if (!["0", "1"].includes(status)) {
              return res.status(400).json({
                success: false,
                message: "Invalid status value. Use '0' (inactive) or '1' (active).",
              });
            }
        
            const updatedCountry = await countryModel.findByIdAndUpdate(
              id,
              { status },
              { new: true }
            );
        
            if (!updatedCountry) {
              return res.status(404).json({
                success: false,
                message: "Country not found with the given ID",
              });
            }
        
            return res.status(200).json({
              success: true,
              message: "Country status updated successfully",
              data: updatedCountry,
            });
        
          } catch (error) {
            return res.status(500).json({
              success: false,
              message: "Internal Server Error",
              error: error.message,
            });
          }
        };
        
        const getActiveCountries = async (req, res) => {
          try {
            const activeCountriesData = await countryModel.find({ status: "1" });
        
            if (!activeCountriesData || activeCountriesData.length === 0) {
              return res.status(400).json({
                success: false,
                message: "No active countries found",
              });
            }
        
            return res.status(200).json({
              success: true,
              message: "Active countries data fetched successfully",
              data: activeCountriesData,
            });
        
          } catch (error) {
            return res.status(500).json({
              success: false,
              message: "Internal Server Error",
              error: error.message,
            });
          }
        };
        

          // Api for active inactive staff user
             const active_inactive_staff_user = async (req , res )=> {
                    try {
                            const staff_user_id = req.params.staff_user_id
                            // check for staff user id
                            if(!staff_user_id)
                            {
                                return res.status(400).json({
                                       success : false ,
                                       message : 'Staff User Id Required'
                                })
                            }

                            // check for staff user
                            const staff_user = await userModel.findOne({ _id : staff_user_id , role : { $ne : 'Admin' }})
                            if(!staff_user)
                            {
                                return res.status(400).json({
                                       success : false ,
                                       message : 'No User Found'
                                })
                            }
                                   let message = ''
                                if(staff_user.status === 0)
                                {
                                      staff_user.status = 1
                                      message = `${staff_user.role} is Active`
                                }
                                else
                                {
                                    staff_user.status = 0
                                      message = `${staff_user.role} is Inactive`
                                }

                                  await staff_user.save()

                                  return res.status(200).json({
                                       success : true,
                                       message : message
                                  })

                         
                    } catch (error) {
                        return res.status(500).json({
                              success : false ,
                              message : 'Server error',
                              error_message : error.message
                        })
                    }
             }
                                                          /* Hospital Section */

      // Api for add Hospital 

          const add_hospital = async( req , res )=> {

                try {
                       const { hospitalName , location , hospitalCode , contact } = req.body

                       // check for require fields
                           const requiredFields = ['hospitalName' , 'location' , 'hospitalCode' , 'contact']
                           for( const field of requiredFields )
                           {
                                if( !req.body[field])
                                {
                                    return res.status(400).json({  success : false ,
                                         message : `Required ${field.replace('_',' ')}`
                                    })
                                }
                           }

                           // check for already exist hospital
                              const exist_hospital = await hospitalModel.findOne({ hospitalCode })
                              if(exist_hospital)
                              {
                                return res.status(400).json({
                                       success : false , 
                                       message : 'Hospital Already Exist'
                                })
                              }

                              const hospitalImage = req.file.filename 
                            // add new Record
                            const add_new_hospital = new hospitalModel({
                                   hospitalName,
                                   location ,
                                   hospitalCode,
                                   contact,
                                   hospitalImage : hospitalImage,
                                   PatientAssigned : []
                            })

                            await add_new_hospital.save()
                            return res.status(200).json({
                                  success : true ,
                                  message : 'New Hospital addedd successfully',
                                  details : add_new_hospital
                            })

                } catch (error) {
                      return res.status(500).json({
                          success : false,
                          message : 'Server error',
                          error_message : error.message
                      })
                }
          }

// Api for get all Hostpital 
          const getAll_hospital = async( req , res)=> {
               try {
                     const all_hospital = await hospitalModel.find({ }).sort({ createdAt : -1 }).lean()
                     if(!all_hospital)
                     {
                        return res.status(400).json({
                              success : false ,
                              message : 'NO Hospital Details Found'
                        })
                     }

                     return res.status(200).json({
                           success : true ,
                           message : 'All Hospital',
                           Hospital_Details : all_hospital.map((h)=> ({
                                    hospitalId : h._id ,
                                   hospitalName : h.hospitalName,
                                   location : h.location,
                                   hospitalCode : h.hospitalCode,
                                   contact : h.contact,
                                   hospitalImage : h.hospitalImage,
                                   status : h.status

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

// Api for get all active hospitals

          const getActiveHospitals = async (req, res) => {
  try {
    const activeHospitals = await hospitalModel
      .find({ status: 1 })
      .sort({ createdAt: -1 })
      .lean();

    if (!activeHospitals || activeHospitals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active hospitals found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Active Hospitals',
      Hospital_Details: activeHospitals.map((h) => ({
        hospitalId: h._id,
        hospitalName: h.hospitalName,
        location: h.location,
        hospitalCode: h.hospitalCode,
        contact: h.contact,
        hospitalImage: h.hospitalImage,
        status: h.status,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error_message: error.message,
    });
  }
};


    // Api for update Hospital Details 
           const update_Hospital_Details = async( req , res )=> {
            try {
                const { hospitalId } = req.params
                const { hospitalName , location , contact } = req.body
                // check for hospitalId
                if(!hospitalId)
                    {
                          return res.status(400).json({
                               success : false ,
                               message : 'Hospital Id Required'
                          })
                    }  

                // check for Hospital 
                const hospital = await hospitalModel.findOne({ _id : hospitalId })
                if(!hospital)
                {
                    return res.status(400).json({
                          success : false ,
                          message : 'Hospital Not Found'
                    })
                }

                   if(hospitalName)
                   {
                    hospital.hospitalName = hospitalName
                   }
                   
                   if(location)
                    {
                        hospital.location = location
                    }
                    
                   if(contact)
                    {
                        hospital.contact = contact
                    }
                    
                   
                    if(req.file)
                    {
                        hospital.hospitalImage = req.file.filename
                    }

                    await hospital.save()

                    return res.status(200).json({
                          success : true ,
                          message : 'Details updated',
                          details : {
                                _id : hospital._id,
                               hospitalName : hospital.hospitalName,
                               location : hospital.location,
                               contact : hospital.contact,
                               hospitalImage : hospital.hospitalImage,
                               hospitalCode : hospital.hospitalCode,
                               status : hospital.status
                          }
                    })
           } catch (error) {
               return res.status(500).json({
                   success : false ,
                   message : 'Server error',
                   error_message : error.message
               })
           }
           }

    // Api for update hospital status

    const changeHospitalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status === undefined) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    if (![0, 1].includes(Number(status))) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value. Use 0 (inactive) or 1 (active).",
      });
    }

    const updatedHospital = await hospitalModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    console.log(updatedHospital)

    if (!updatedHospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found with the given ID",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hospital status updated successfully",
      data: updatedHospital,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


           // delete Hospital

           const delete_hospital = async( req , res )=> {
               try {
                         const { hospitalId } = req.params
                         // check for required fields
                         if(!hospitalId)
                         {
                           return res.status(400).json({
                               success : false ,
                               message : 'hospital Id required'
                           })
                         }

                         // check for hospital 
                         const hospital = await hospitalModel.findOne({ _id : hospitalId })
                         if(!hospital)
                         {
                          return res.status(400).json({
                              success : false ,
                              message : 'Hospital Not Found'
                          })
                         }

                            if(hospital.PatientAssigned.length > 0)
                            {
                                 return res.status(400).json({
                                    success : false ,
                                    message : `Cannot delete hospital. Patients are still assigned.`
                                 })
                            }

                            await hospital.deleteOne()
                            return res.status(200).json({
                                success : true ,
                                message : 'Hospital Deleted Successfully'
                            })
               } catch (error) {
                    return res.status(500).json({
                         success : false ,
                         message : 'Server error',
                         error_message : error.message
                    })
               }
           }

                                                                /* Patient Section */

                                                                        // Function to generate a random number
        function generateRandomNumber(length) {
          let result = '';
          const characters = '0123456789';
          const charactersLength = characters.length;
      
          for (let i = 0; i < length; i++) {
              result += characters.charAt(Math.floor(Math.random() * charactersLength));
          }
      
          return result;
      }


        // Api for add New Enquiry

        const add_new_enq = async (req, res) => {
          try {
            let { 
              name, 
              age, 
              gender, 
              email, 
              emergency_contact_no, 
              address,
              patient_emergency_contact_no,
              country,
              disease_name,
              patient_relation_name,
              patient_relation,
            } = req.body;
        
            let userId = req.params.userId;
        
            // Validate userId
            if (!userId) {
              return res.status(400).json({
                success: false,
                message: 'User Id Required',
              });
            }
        
            const imageFields = [ ".jpeg",".jpg",".png"]
            let patient_relation_id = ""
            if(req.file){
              const fileExtension = path.extname(req.file.filename).toLowerCase()
                if(imageFields.includes(fileExtension)){
                   patient_relation_id = req.file.filename
                }
              else{
                return res.status(400).json({
                  success : false,
                    message: 'Invalid file type. Only .jpg, .jpeg, and .png files are allowed.'
                })
              }
            }

            // Fetch user
            const user = await userModel.findOne({ _id: userId });
            if (!user) {
              return res.status(400).json({
                success: false,
                message: 'User not Found',
              });
            }
        
            const countryData = await countryModel.findOne({ name: country });
        
            // Required fields check
            const requiredFields = [
              'name', 
              'age', 
              'gender', 
              'email', 
              'country', 
              "address",
              "patient_relation_name",
              "patient_relation",
              "patient_emergency_contact_no",
              'emergency_contact_no',
              'disease_name'
            ];
        
            for (let field of requiredFields) {
              if (!req.body[field]) {
                return res.status(400).json({
                  success: false,
                  message: `Required ${field.replace('_', ' ')}`,
                });
              }
            }
        
            // Check if enquiry already exists
            const exist_enq = await enquiryModel.findOne({ email });
            if (exist_enq) {
              return res.status(400).json({
                success: false,
                message: 'Enquiry already exists',
              });
            }
        
            // Create new enquiry
            const enquiryId = `Enq-${generateRandomNumber(5)}`;
            const newEnq = new enquiryModel({
              enquiryId,
              name,
              age,
              gender,
              email,
              emergency_contact_no,
              country,
              phoneCode: countryData?.dial_code || '',
              created_by: [{
                Name: user.name,
                role: user.role,
                userId: userId,
              }],
              disease_name,
              address,
              patient_relation_name,
              patient_relation,
              patient_emergency_contact_no,
              patient_relation_id
            });
        
            await newEnq.save();
        
            //  Send WhatsApp confirmation
            if (emergency_contact_no && countryData?.phoneCode) {
              const phoneCode = countryData.phoneCode.startsWith('+') 
                ? countryData.phoneCode 
                : `+${countryData.phoneCode}`;
              const fullNumber = `${phoneCode}${String(emergency_contact_no)}`;
        
              const waMessage = `Hello ${name}, your enquiry for "${disease_name}" has been received successfully.\nOur team will contact you shortly. Thank you!`;
        
              try {
                const waResult = await sendWhatsAppMessage(fullNumber, waMessage);
                console.log("WhatsApp Sent:", waResult);
              } catch (waErr) {
                console.error("WhatsApp Error:", waErr.message);
              }
            }
        
            return res.status(200).json({
              success: true,
              message: 'Enquiry submitted successfully!',
            });
        
          } catch (error) {
            return res.status(500).json({
              success: false,
              message: 'Server Error',
              error_message: error.message,
            });
          }
        };
        


    // Api for get all Enquiry

    const all_Enq = async (req, res) => {
      try {
      
        const statusPriority = {
          'Pending': 1,
          'Follow-Up': 2,
          'Hold': 3,
          'Dead': 4
        };
        
        const get_enq = await enquiryModel
          .aggregate([
            {
              $match: {
                enq_status: { $nin: ['Confirmed'] }  
              }
            },
            {
              $addFields: {
                statusPriority: {
                  $switch: {
                    branches: [
                      { case: { $eq: ['$enq_status', 'Pending'] }, then: 1 },
                      { case: { $eq: ['$enq_status', 'Follow-Up'] }, then: 2 },
                      { case: { $eq: ['$enq_status', 'Hold'] }, then: 3 },
                      { case: { $eq: ['$enq_status', 'Dead'] }, then: 4 }
                    ],
                    default: 5
                  }
                }
              }
            },
            {
              $sort: { statusPriority: 1, createdAt: -1 }  
            },
            {
              $project: { 
                enquiryId: 1,
                name: 1,
                email: 1,
                age: 1,
                gender: 1,
                country: 1,
                emergency_contact_no: 1,
                address : 1,
                patient_emergency_contact_no : 1,
                enq_status: 1,
                created_by: 1,
                disease_name: 1,
                patient_relation_name:1,
patient_relation:1,
patient_relation_id:1

              }
            }
          ]);
    
        // Check if any enquiries were found
        if (!get_enq || get_enq.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No Enquiry Details found'
          });
        }
    
        // Return the response
        return res.status(200).json({
          success: true,
          message: 'All Enquiries',
          details: get_enq.map((p) => ({
            enquiryId: p.enquiryId,
            name: p.name,
            email: p.email,
            age: p.age,
            gender: p.gender,
            country: p.country,
            emergency_contact: p.emergency_contact_no,
            address : p.address,
            patient_emergency_contact_no:p.patient_emergency_contact_no,
            patient_relation_name:p.patient_relation_name,
              patient_relation:p.patient_relation,
              patient_relation_id : p.patient_relation_id,
            Enquiry_status: p.enq_status,
            createdBy: p.created_by[0]?.role || 'N/A', 
            disease_name: p.disease_name
          }))
        });
    
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Server error',
          error_message: error.message
        });
      }
    };
    

// Api for get particular enquiry
const get_Enq = async( req , res )=> {
  try {
   const enquiryId = req.params.enquiryId
               // check for enquiryId
               if(!enquiryId)
               {
                 return res.status(400).json({
                      success : false ,
                      message : 'enquiry Id Required'
                 })
               }

               // check for Enquiry
               const enq = await enquiryModel.findOne({ enquiryId : enquiryId })
               if(!enq)
               {
                 return res.status(400).json({
                      success : false ,
                      message : 'enquiry Details Not Found'
                 })
               }
               return res.status(200).json({
                    success : true ,
                    message : 'Enquiry Detail',
                    detail : {
                      enquiryId : enq.enquiryId ,
                     name : enq.name,
                     age : enq.age,
                     country : enq.country ,
                     email : enq.email ,
                     gender : enq.gender ,
                     emergency_contact_no : enq.emergency_contact_no,
                     address:enq.address,
                     patient_emergency_contact_no:enq.patient_emergency_contact_no,
                     patient_relation_name:enq.patient_relation_name,
              patient_relation:enq.patient_relation,
              patient_relation_id : enq.patient_relation_id,
                     enq_status : enq.enq_status,                
                      created_by : enq.created_by[0].role,
                      disease_name : enq.disease_name,
                     discussionNotes : enq.discussionNotes.map((d)=> ({
                             note : d.note,
                             date : d.date
                     })) || []
                    }
               })
  } catch (error) {
      return res.status(500).json({
          success : false ,
          message : 'Server error',
          error_message : error.message
      })
  }
}


// Api for update Enquiry

const update_enq = async (req, res) => {
  try {
    const enquiryId = req.params.enquiryId;
    const {
      name,
      age,
      gender,
      email,
      emergency_contact_no,
      country,
      disease_name,
      address,
      patient_emergency_contact_no,
      patient_relation_name,
      patient_relation,
      discussionNotes
    } = req.body;

    if (!enquiryId) {
      return res.status(400).json({
        success: false,
        message: 'enquiryId Required'
      });
    }

    const enq = await enquiryModel.findOne({ enquiryId });
    if (!enq) {
      return res.status(400).json({
        success: false,
        message: 'No enquiry Found'
      });
    }

    // Update fields if provided
    if (name) enq.name = name;
    if (age) enq.age = age;
    if (gender) enq.gender = gender;
    if (email) enq.email = email;
    if (emergency_contact_no) enq.emergency_contact_no = emergency_contact_no;
    if (country) enq.country = country;
    if (disease_name) enq.disease_name = disease_name;
    if (address) enq.address = address;
    if (patient_emergency_contact_no) enq.patient_emergency_contact_no = patient_emergency_contact_no;
    if (patient_relation_name) enq.patient_relation_name = patient_relation_name;
    if (patient_relation) enq.patient_relation = patient_relation;

    // Handle patient_relation_id (image)
    const imageFields = [".jpeg", ".jpg", ".png"];
    if (req.file) {
      const fileExtension = path.extname(req.file.filename).toLowerCase();
      if (imageFields.includes(fileExtension)) {
        enq.patient_relation_id = req.file.filename;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Only .jpg, .jpeg, and .png files are allowed.'
        });
      }
    }

    // Append discussionNotes if provided
    if (discussionNotes) {
      const today = new Date();
      if (!Array.isArray(enq.discussionNotes)) {
        enq.discussionNotes = [];
      }
      enq.discussionNotes.push({
        note: discussionNotes,
        date: today
      });
    }

    await enq.save();

    return res.status(200).json({
      success: true,
      message: 'Enquiry details updated'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error_message: error.message
    });
  }
};



// Api for update Enquiry status
const update_Enquiry_status = async (req, res) => {
  try {
    const { enquiryId } = req.params;
    const { status } = req.body;

    if (!enquiryId) {
      return res.status(400).json({
        success: false,
        message: "enquiryId is required",
      });
    }

    if (status === undefined || typeof status !== "number") {
      return res.status(400).json({
        success: false,
        message: "Valid status is required",
      });
    }

    const enquiry = await enquiryModel.findOne({ enquiryId });
    if (!enquiry) {
      return res.status(400).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    const statusMappings = {
      1: { enq_status: "Confirmed" },
      2: { enq_status: "Hold" },
      3: { enq_status: "Follow-Up" },
      4: { enq_status: "Dead" },
    };

    const updateData = statusMappings[status];
    if (!updateData) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    Object.assign(enquiry, updateData);
    await enquiry.save();

    // ✅ If status is Confirmed, create or update patient
    if (enquiry.enq_status === 'Confirmed') {
      const exist_patient = await patientModel.findOne({ email: enquiry.email });

      if (exist_patient) {
        exist_patient.patient_name = enquiry.name;
        exist_patient.age = enquiry.age;
        exist_patient.country = enquiry.country;
        exist_patient.phoneCode = enquiry.phoneCode;
        exist_patient.gender = enquiry.gender;
        exist_patient.emergency_contact_no = enquiry.emergency_contact_no;
        exist_patient.address = enquiry.address;
        exist_patient.patient_emergency_contact_no = enquiry.patient_emergency_contact_no;
        exist_patient.patient_relation = enquiry.patient_relation
        exist_patient.patient_relation_name = enquiry.patient_relation_name
        exist_patient.patient_relation_id = enquiry.patient_relation_id
        exist_patient.patient_disease = {
          disease_name: enquiry.disease_name,
        };
        exist_patient.created_by = enquiry.created_by;

        await exist_patient.save();
      } else {
        const patientId = `Pt-${generateRandomNumber(5)}`;
        const newPatient = new patientModel({
          patientId: patientId,
          enquiryId: enquiry.enquiryId,
          patient_name: enquiry.name,
          age: enquiry.age,
          country: enquiry.country,
          phoneCode: enquiry.phoneCode,
          email: enquiry.email,
          gender: enquiry.gender,
          emergency_contact_no: enquiry.emergency_contact_no,
          patient_disease: {
            disease_name: enquiry.disease_name,
          },
          address : enquiry.address,
          patient_emergency_contact_no : enquiry.patient_emergency_contact_no,
          created_by: enquiry.created_by,
          patient_relation : enquiry.patient_relation,
          patient_relation_name : enquiry.patient_relation_name,
          patient_relation_id : enquiry.patient_relation_id,
          discussionNotes: enquiry.discussionNotes,
          medical_History: [],
          Kyc_details: [],
          services: [],
        });

        await newPatient.save();
      }
    }

    //  Send WhatsApp message to the patient
    if (enquiry.emergency_contact_no && enquiry.phoneCode) {
      const phoneCode = enquiry.phoneCode.startsWith('+') ? enquiry.phoneCode : `+${enquiry.phoneCode}`;
      const fullNumber = `${phoneCode}${String(enquiry.emergency_contact_no)}`;
      const waMessage = `Hello ${enquiry.name}, your enquiry status has been updated to "${enquiry.enq_status}".\n\nThank you for choosing our service!`;

      try {79
        const result = await sendWhatsAppMessage(fullNumber, waMessage);
        console.log(" WhatsApp Sent:", result);
      } catch (waErr) {
        console.error(" WhatsApp Error:", waErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Enquiry status updated successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error_message: error.message,
    });
  }
};


// Api for enquiry history of last 6 months that is not confirmed

const getOldEnquiryHistory = async (req, res) => {
  try {
    // Get the date 6 months ago from today
    const sixMonthsAgo = new Date();
    console.log(sixMonthsAgo.getMonth()-6)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    console.log(sixMonthsAgo)

    // Fetch all enquiries older than 6 months where status is NOT "confirmed"
    const enquiries = await enquiryModel.find({
      status: { $ne: "Confirmed" }, 
      createdAt: { $lte: sixMonthsAgo }, 
    }).sort({ createdAt: -1 }); 

    return res.status(200).json({
      success: true,
      message: "Old enquiry history retrieved successfully",
      data: enquiries,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error_message: error.message,
    });
  }
};


// Api for delete enquiry

const deleteEnquiry = async (req,res) => {
  try {
    const {enquiryId} = req.params
    if(!enquiryId){
      return res.status(400).json({
        success : false,
        message : "Enquiry id is required"
      })
    }

    const enquiryData = await enquiryModel.deleteOne({enquiryId})

    if(!enquiryData){
      return res.status(400).json({
        success : false,
        message : "No enquiry data found"
      })
    }

    return res.status(200).json({
      success : true,
      message : `Enquiry data deleted successfully`,
      data : enquiryData
    })


  } catch (error) {
    return res.status(500).json({
      success : false,
      message : "Internal Server Error",
      error : error.message
    })
  }
}

// Api for add more notes with date

const add_notes = async(req,res)=>{
  try {
    const {enquiryId} = req.params
    if(!enquiryId){
      return res.status(400).json({
        success : false,
        message : "Enquiry id is required"
      })
    }

    const {note , date} = req.body
    if(!note){
      return res.status(400).json({
        success : false,
        message : "note is required"
      })
    } if(!date){
      return res.status(400).json({
        success : false,
        message : "date is required"
      })
    }

    const enquiryData = await enquiryModel.findOne({enquiryId})
    if(!enquiryData){
      return res.status(400).json({
        success : false,
        message : "Enquiry id not found"
      })
    }

    let newDiscussion = {
      note,date
    }

    enquiryData.discussionNotes.push(newDiscussion)
    await enquiryData.save()

    const patientData = await patientModel.findOne({enquiryId})
    console.log(patientData);
    
    if(patientData){
      patientData.discussionNotes.push(newDiscussion)
      await patientData.save()
    }

    return res.status(200).json({
      success : true,
      message : "Note added succcessfully"
    })

  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success : false,
      message : "Internal Server Error",
      error : error.message
    })
  }
}

// Api for get all patient details
              const all_patients = async( req , res )=> {
                    try {
                           const { disease_name , country  } = req.query
                           const filter = {};
                            // Gender filter
                            if (disease_name) {
                              filter["patient_disease.disease_name"] = disease_name; 
                          }
                            if (country) {
                              filter.country = country; 
                          }
                            // check for all patient
                            const get_patient = await patientModel.find({ ...filter }).sort({ createdAt : -1}).lean()
                            if(!get_patient)
                            {
                              return res.status(400).json({
                                  success : false ,
                                  message : 'No Patient Details found'
                              })
                            }
                            return res.status(200).json({
                                 success : true ,
                                 message : 'All patient',
                                 details : get_patient.map((p)=> ({
                                          patientId  : p.patientId,
                                          patient_name : p.patient_name,
                                          email : p.email,
                                          age : p.age,
                                          gender : p.gender,
                                          country : p.country,
                                          phoneCode : p.phoneCode,
                                          patient_disease : p.patient_disease,
                                          treatment_course_name : p.treatment_course_name,
                                          emergency_contact : p.emergency_contact_no,
                                          patient_status : p.patient_status,
                                          patient_type : p.patient_type,
                                          enquiryId : p.enquiryId,
                                           createdBy : p.created_by[0].role,   
                                           createdAt : p.createdAt                                
                                         
                                 }))
                            })
                    } catch (error) {
                        return res.status(500).json({
                             success : false,
                             message : 'Server error',
                             error_message : error.message
                        })
                    }
              }

          // Api for get particular patient Details
          const get_patient = async (req, res) => {
            try {
                const { patientId } = req.params;
        
                // Check for patient ID
                if (!patientId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Patient Id Required',
                    });
                }
        
                // Fetch patient details
                const patient = await patientModel.findOne({ patientId }).lean();
                if (!patient) {
                    return res.status(400).json({
                        success: false,
                        message: 'Patient Details Not Found',
                    });
                }
        
                // Fetch patient's treatment details
                const patient_treatment = await treatmentModel
                    .find({ patientId })
                    .sort({ updatedAt: -1 })
                    .lean();
        
                // Map patient treatment details and payment details
                const treatments = patient_treatment.map((t) => ({
                    treatment_id: t.treatment_id,
                    treatment_name: t.treatment_course_name,     
                    treatment_course_fee : t.treatment_course_fee    ,         
                    treatment_total_charge : t.totalCharge,
                     treatment_due_payment : t.duePayment  ,
                     treatment_status : t.status,
                     Hospital_details : t.hospital,
                     appointments_details : t.appointments,
                     services : t.services,
                    //  freeServices : t.freeServices    
                }));
        
                const payment_details = patient_treatment.flatMap((t) =>
                    t.payment_details.map((p) => ({
                        treatment_id : t.treatment_id,
                        paid_amount: p.paid_amount,
                        paymentMethod: p.paymentMethod,
                        payment_Date: p.payment_Date,
                    }))
                );
                
                return res.status(200).json({
                    success: true,
                    message: 'Patient Detail',
                    detail: {
                        patientId: patient.patientId,
                        patient_name: patient.patient_name,
                        age: patient.age,
                        country: patient.country,
                        email: patient.email,
                        gender: patient.gender,
                        phoneCode : patient.phoneCode,
                        emergency_contact_no: patient.emergency_contact_no,
                        address:patient.address,
                        patient_emergency_contact_no : patient.patient_emergency_contact_no,
                        patient_status: patient.patient_status,
                        patient_disease: patient.patient_disease.map((m) => ({
                            disease_name: m.disease_name,
                        })),
                        treatment_course_id: patient_treatment.treatment_course_id,
                        patient_type: patient.patient_type,
                        created_by: patient.created_by[0]?.role || 'N/A',
                        discussionNotes: patient.discussionNotes.map((d) => ({
                            note: d.note,
                            date: d.date,
                        })),
                        treatmentCount: patient.treatmentCount,
                        serviceCount: patient.serviceCount,
                        Kyc_details: patient.Kyc_details || [],
                        // services: patient.services || [],
                        payment_details,
                        treatments,
                        
                    },
                });
            } catch (error) {
                
                return res.status(500).json({
                    success: false,
                    message: 'Server error',
                    error_message: error.message,
                });
            }
        };
        
        
      // Api for delete particular patient record 
                       const deletePatient = async( req , res )=> {
                            try {
                                  const patientId = req.params.patientId
                                  // check for patient Id
                                  if(!patientId)
                                  {
                                    return res.status(400).json({
                                         success : false ,
                                         message : 'Patient Id Required'
                                    })
                                  }

                                  // check for patient
                                  const patient = await patientModel.findOne({ patientId : patientId })
                                  if(!patient)
                                  {
                                    return res.status(400).json({
                                         success : false ,
                                         message : 'Patient Details Not Found'
                                    })
                                  }
                                    // check for hospital
                                //    const hospital = await hospitalModel.findOne({ _id : patient.hospital_id })

                                    // await hospitalModel.updateOne(
                                    //                 { _id: hospital._id },
                                    //                 { $pull: { PatientAssigned: { patientId } } } 
                                    //          );
                                 
                                  await patient.deleteOne()

                                  return res.status(200).json({ 
                                        success : true ,
                                        message : 'Patient Record Deleted successfully'
                                  })
                            } catch (error) {
                                 return res.status(500).json({
                                     success : false ,
                                     message : 'Server error',
                                     error_message : error.message
                                 })
                            }
                       }


      // Api for get notes for particular patient 
      
      const get_notes_by_patient = async(req,res)=>{
        try {
          const patientId = req.params.patientId
          if(!patientId){
            return res.status(400).json({
              success : false,
              message : "patient id is required"
            })
          }

          const patientData = await patientModel.findOne({patientId})
          if(!patientData || patientData.length ===0){
            return res.status(400).json({
              success : false,
              message : "No patient data found"
            })
          }
          console.log(patientData);
          
         

           return res.status(200).json({
            success : true,
            message : "All patient notes fetched successfully",
            data : patientData.discussionNotes
           })

        } catch (error) {
          return res.status(500).json({
            success : false,
            message : "Internal Server Error",
            error : error.message
          })
        }
      }
  

    
// Api for upload patient with excel
            
          // Generate sample file
                     
          const generate_sampleFile = async (req, res) => {
            try {
              const workbook = new ExcelJs.Workbook();
              const worksheet = workbook.addWorksheet("Enquiry");
          
              // Add the headers (consistent with the requiredHeaders)
              worksheet.addRow([
                "Name",
                "Age",
                "Email",
                "Gender",
                "Country",
                "Contact Number",
                "Disease Name",
              ]);
          
              // Add sample data
              worksheet.addRow([
                "SAMUEL SESAY",
                "42",
                "xyz@gmail.com",
                "Male",
                "India",
                "7894651320",
                "Cancer",
              ]);
          
              // Set response headers for Excel download with the filename
              res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              );
              res.setHeader(
                "Content-Disposition",
                "attachment; filename=sample_sheet.xlsx"
              );
          
              // Send the Excel file as a response
              await workbook.xlsx.write(res);
              res.end();
              console.log("Excel file sent");
            } catch (error) {
              console.error("Error sending Excel file:", error);
              res.status(500).send("Internal Server Error");
            }
          };
          

  // Api for import patient 

  const generateEnquiryId = () => {
    // Generates a random 5-digit number
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `Enq-${randomNum}`;
  };

  const import_file = async (req, res) => {
    try {
      const { userId } = req.params;
  
      // Validate userId
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }
  
      // Fetch user details
      const user = await userModel.findOne({ _id: userId });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
  
      const workbook = new ExcelJs.Workbook();
      await workbook.xlsx.readFile(req.file.path);
  
      const worksheet = workbook.getWorksheet(1);
      const requiredHeaders = [
        "Name",
        "Age",
        "Email",
        "Gender",
        "Country",
        "Contact Number",
        "Disease Name",
      ];
  
      // Validate headers with normalization
      const actualHeaders = [];
      worksheet.getRow(1).eachCell((cell) => {
        actualHeaders.push(cell.value);
      });
  
      console.log(actualHeaders);
      
     
  
      const isValidHeaders = requiredHeaders.every((header, index) => {
        return (
          header.toLowerCase().trim() === actualHeaders[index]?.toLowerCase().trim()
        );
      });
  
      if (!isValidHeaders) {
        return res.status(400).json({
          success: false,
          error: "Use sample file format to import the data",
        });
      }
  
      const fileData = [];
      const emailSet = new Set();
  
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          const rowData = {
            enquiryId: generateEnquiryId(),
            name: row.getCell(1).value,
            age: row.getCell(2).value,
            email:
              typeof row.getCell(3).value === 'object' && row.getCell(3).value !== null
                ? row.getCell(3).value.text || row.getCell(3).value.hyperlink.split('mailto:')[1]
                : row.getCell(3).value,
            gender: row.getCell(4).value,
            country: row.getCell(5).value,
            emergency_contact_no: row.getCell(6).value || 0,
            disease_name: row.getCell(7).value,
            patient_type: row.getCell(8)?.value || "Unknown",
            created_by: [
              {
                Name: user.name,
                role: user.role,
                userId: userId,
              },
            ],
          };
  
          if (rowData.email && !emailSet.has(rowData.email)) {
            emailSet.add(rowData.email);
            fileData.push(rowData);
          }
        }
      });
  
      
      const uniqueData = [];
      for (const data of fileData) {
        const existingRecord = await enquiryModel.findOne({ email: data.email });
        console.log(existingRecord);
        if (existingRecord) {
          console.log(`Existing record found for email: ${data.email}`);
        } else {
          console.log(`New record to insert: ${data.email}`);
          uniqueData.push(data);
        }
      }
      
      console.log("File Data: ", fileData);
      console.log("Unique Data: ", uniqueData);
            

      if (uniqueData.length > 0) {
        // Insert the unique data into the database
        await enquiryModel.insertMany(uniqueData);
  
        res.status(200).json({
          success: true,
          message: "Data imported successfully",
        });
      } else {
        res.status(200).json({
          success: true,
          message: "No new data to import",
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: "There was an error while importing data",
      });
    }
  };
  

  // Api for update patient Details 
   const update_patient = async( req , res )=> {
        try {
              const patientId = req.params.patientId
              const {  patient_name , age , gender , email , emergency_contact_no ,
                      country  , discussionNotes  } = req.body

                  // check for patient Id
                if(!patientId)
                {
                      res.status(400).json({
                          success : false ,
                          message : 'Patient Id Required'
                      })
                }
                
                   // check for patient 
                   
                   const patient = await patientModel.findOne({ patientId : patientId })
                   if(!patient)
                   {
                    return res.status(400).json({
                         success : false ,
                         message : 'No Patient Found'
                    })
                   }
                     
                       if(patient_name)
                       {
                          patient.patient_name = patient_name
                       }
                       
                       if(age)
                        {
                           patient.age = age
                        }
                       if(gender)
                        {
                           patient.gender = gender
                        }                        
                       if(email)
                        {
                           patient.email = email
                        }
                       if(emergency_contact_no)
                        {
                           patient.emergency_contact_no = emergency_contact_no
                        }
                       if(country)
                        {
                           patient.country = country
                        }                      
                    
                        var today = new Date()
                        if(discussionNotes)
                        {
                          patient.discussionNotes.push({
                                 note : discussionNotes ,
                                 date : today
                          })                     
                        }

                        await patient.save()
                        return res.status(200).json({
                             success : true ,
                             message : 'patient Details updated'
                        })
                        

        } catch (error) {
             return res.status(500).json({
                 success : false ,
                 message : 'Server error',
                 error_message : error.message
             })
        }
   }

      // Api for update patient status 
      const update_patient_status = async (req, res) => {
        try {
          const { patientId } = req.params;
          const { status } = req.body;
      
          // Validate patientId
          if (!patientId) {
            return res.status(400).json({
              success: false,
              message: "PatientId is required",
            });
          }
      
          // Validate status
          if (status === undefined || typeof status !== "number") {
            return res.status(400).json({
              success: false,
              message: "Valid status is required",
            });
          }
      
          // Find patient
          const patient = await patientModel.findOne({ patientId });
          if (!patient) {
            return res.status(400).json({
              success: false,
              message: "Patient not found",
            });
          }
        
          const statusMappings = {
            1: { patient_status: "Confirmed" },
            2: { patient_status: "Denied" ,  patient_type: "Dead"  },
            3: { patient_status: "Follow-Up", patient_type: "Repeat" },
            4: { patient_status: "Completed", patient_type: "Completed" },
          };
      
          // Update patient status
          const updateData = statusMappings[status];
          if (!updateData) {
            return res.status(400).json({
              success: false,
              message: "Invalid status value",
            });
          }
      
          Object.assign(patient, updateData);          
      
          // Save updated patient
          await patient.save();
       
          
          return res.status(200).json({
            success: true,
            message: "Patient status updated successfully",
           
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: "Server error",
            error_message: error.message,
          });
        }
      };
      
                                                             /* Appointment Section */
            
    // Api for create appointment
    const create_appointment = async (req, res) => {
      try {
        const userId = req.params.userId;
        const { patientId, treatment_id, hospitalId, note, appointment_Date,pickup_time, vehicle_no, driver_name, driver_contact } = req.body;
    
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: "User Id Required",
          });
        }
    
        const user = await userModel.findOne({ _id: userId });
        if (!user) {
          return res.status(400).json({
            success: false,
            message: "User Not Found",
          });
        }
    
        const requiredFields = ["patientId", "note", "hospitalId", "treatment_id", "appointment_Date"];
        for (let field of requiredFields) {     
          if (!req.body[field]) {
            return res.status(400).json({
              success: false,
              message: `Required ${field.replace("_", " ")}`,
            });
          }
        }
    
        const patient = await patientModel.findOne({ patientId : patientId });
        if (!patient) {
          return res.status(400).json({
            success: false,
            message: "Patient Not Found",
          });
        }
    
        const treatment = await treatmentModel.findOne({ treatment_id });
        if (!treatment) {
          return res.status(400).json({
            success: false,
            message: "Patient Treatment Details Not Found",
          });
        }
        
        // Convert the hospitalId string to ObjectId
        const hospitalObjectId = new mongoose.Types.ObjectId(hospitalId);
        
        const hospital = treatment.hospital.find(
          (h) => h.hospital_id.toString() === hospitalObjectId.toString()
        );
        if (!hospital) {
          return res.status(400).json({
            success: false,
            message: `Patient not assigned in given hospital  for treatment: ${treatment_id}`,
          });
        }
    
        const existingAppointment = await appointmentModel.findOne({
          patientId,
          treatment_id,
          status: { $ne: "Complete" },
        });
    
        if (existingAppointment) {
          existingAppointment.status = "Complete";
          await existingAppointment.save();
        
          treatment.appointments.forEach((appt) => {
            if (appt.appointmentId === existingAppointment.appointmentId) {
              appt.status = "Complete";
            }
          });
        
          await treatment.save();
        }
        
    
       
        const appointmentId = `Appt-${generateRandomNumber(5)}`;
        const newAppointment = new appointmentModel({
          appointmentId,
          patientId,
          patientName: patient.patient_name,
          treatment_id,
          treatment_name: treatment.treatment_course_name,
          discussionNotes: note,
          appointment_Date,
          hospital_id: hospitalId,
          hospitalName: hospital.hospital_Name || "Unknown Hospital",
          pickup_time,
          vehicle_no,
          driver_name,
          driver_contact,
          createdBy: [
            {
              userId,
              name: user.name,
              role: user.role,
            },
          ],
        });
    
        await newAppointment.save();
    
        if (!treatment.appointments.some((appt) => appt.appointmentId === appointmentId)) {
          treatment.appointments.push({
            appointmentId,
            appointment_Date,
            disease_name : newAppointment.treatment_name,
            status: newAppointment.status,
            pickup_time:newAppointment.pickup_time,
          vehicle_no: newAppointment.vehicle_no,
          driver_name:newAppointment.driver_name,
          driver_contact:newAppointment.driver_contact

          });
        }
    
        treatment.status = "InProgress";
        await treatment.save();
        
        // ✅ Send WhatsApp Message
        if (patient.emergency_contact_no && patient.phoneCode) {
          const phoneCode = patient.phoneCode.startsWith('+') ? patient.phoneCode : `+${patient.phoneCode}`;
          const fullNumber = `${phoneCode}${String(patient.emergency_contact_no)}`;
          
          const waMessage = `Hello ${patient.patient_name}, your appointment for "${treatment.treatment_course_name}" has been scheduled.\n\nDate : ${new Date(appointment_Date).toLocaleDateString()}\nTime : ${new Date(appointment_Date).toLocaleTimeString()}\nHospital : ${hospital.hospital_Name || 'Unknown'}\nPickup Time : ${pickup_time || 'Not provided'}\nVehicle Number : ${vehicle_no || 'N/A'}\nDriver Name : ${driver_name || 'N/A'}\nDriver Phone Number : ${driver_contact || 'N/A'}\n\nThank you!`;
        
          try {
            const whatsappResult = await sendWhatsAppMessage(fullNumber, waMessage);
            console.log("📨 WhatsApp Message Sent:", whatsappResult);
          } catch (waErr) {
            console.error("❌ WhatsApp Error:", waErr.message);
          }
        }
        
        return res.status(200).json({
          success: true,
          message: "Appointment Created Successfully",
        });
        
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Server Error",
          error_message: error.message,
        });
      }
    };
    
    

          // Api for get all appointment 
          const all_appointment = async (req, res) => {
            try {
              // Fetch all appointments
              const getall_appointment = await appointmentModel.find({}).sort({ createdAt: -1 }).lean();
          
              if (!getall_appointment) {
                return res.status(400).json({
                  success: false,
                  message: "No Appointment Found",
                });
              }
                       
               
              return res.status(200).json({
                success: true,
                message: "All Appointments Retrieved",
                data: getall_appointment.map((a)=>({
                    
                       appointmentId : a.appointmentId,
                       patientId : a.patientId,
                       patientName : a.patientName,
                       disease_name : a.treatment_name,                                     
                       appointement_status : a.status,
                       Hospital_name :  a.hospitalName ,
                       discussionNotes : a.discussionNotes,
                       appointment_Date : a.appointment_Date,
                       created_by : a.createdBy[0].role,                        
                       

                })),
              });
            } catch (error) {
              return res.status(500).json({
                success: false,
                message: "Server error",
                error_message: error.message,
              });
            }
          };

          // Get  particular  patient appointment
          
             const get_patient_appointment = async ( req , res )=> {
                     try {
                           const patientId = req.params.patientId
                           // check for patientId
                           if(!patientId)
                           {
                            return res.status(400).json({
                                 success : false ,
                                 message : 'Patient Id Required'
                            })
                           }

                           // check for patient 
                           const patient = await patientModel.findOne({
                               patientId : patientId
                           })

                           if(!patient)
                           {
                              return res.status(400).json({
                                   success : false ,
                                   message : 'Patient Not found'
                              })
                           }  

                           // check for appointment 
                             const appointment = await appointmentModel.find({ patientId }).sort({ createdAt : -1 }).lean()
                             if(!appointment)
                             {
                              return res.status(400).json({
                                   success : false ,
                                   message : 'NO Appointment found for patient'
                              })
                             }

                              
                             return res.status(200).json({
                                 success : false ,
                                 message : 'All Appointments of patient',
                                 appointment : appointment.map((a)=> ({
                                  appointmentId : a.appointmentId,
                                  patientId : a.patientId,
                                  patientName : a.patientName,
                                  disease_name : a.treatment_name,                                                                     
                                   appointement_status : a.status,
                                  Hospital_name :  a.hospitalName,
                                  discussionNotes : a.discussionNotes,
                                  appointment_Date : a.appointment_Date,
                                  created_by : a.createdBy[0].role,
                                 }))
                                 
                             })

                     } catch (error) {
                         return res.status(500).json({
                              success : false,
                              message : 'Server error',
                              error_message : error.message
                         })
                     }
             }
          

          //  Update last appointment status 

          const update_appointment_status = async (req, res) => {
            try {
              const { appointmentId } = req.params;
              const { status } = req.body;
          
              // Validate appointmentId
              if (!appointmentId) {
                return res.status(400).json({
                  success: false,
                  message: "Appointment Id is required",
                });
              }
          
              // Validate status
              if (![2, 3, 4].includes(status)) {
                return res.status(400).json({
                  success: false,
                  message: "Valid status is required",
                });
              }
          
              // Fetch appointment data
              const appointmentData = await appointmentModel.findOne({ appointmentId });
              if (!appointmentData) {
                return res.status(400).json({
                  success: false,
                  message: "Appointment not found",
                });
              }
          
              // Fetch treatment data
              const treatmentData = await treatmentModel.findOne({
                treatment_id: appointmentData.treatment_id,
              });
              if (!treatmentData) {
                return res.status(400).json({
                  success: false,
                  message: "Treatment not found",
                });
              }
          
              // Status mapping
              const changeStatus = {
                2: "Follow-Up",
                3: "Complete",
                4: "Cancelled",
              };
          
              // Update main appointment status
              appointmentData.status = changeStatus[status];
          
              //  Update appointment status in treatmentData.appointments
              treatmentData.appointments = treatmentData.appointments.map((appt) => {
                if (appt.appointmentId === appointmentId) {
                  return {
                    ...appt,
                    status: changeStatus[status],
                  };
                }
                return appt;
              });
          
              // Update overall treatment status
              treatmentData.status = status === 3 ? "Complete" : "InProgress";
          
              // Save changes
              await Promise.all([appointmentData.save(), treatmentData.save()]);
          
              return res.status(200).json({
                success: true,
                message: "Appointment status updated successfully",
              });
            } catch (error) {
              return res.status(500).json({
                success: false,
                message: "Server error",
                error_message: error.message,
              });
            }
          };
               
        
                                                         /* treatement Course section */

                // Api for add treatment course

                const add_treatment_course = async (req, res) => {
                  try {
                    const { course_name, course_price , categories } = req.body;
                
                    // Validate course_name
                    if (!course_name) {
                      return res.status(400).json({
                        success: false,
                        message: 'Course Name is required',
                      });
                    }
                    if (!course_price) {
                      return res.status(400).json({
                        success: false,
                        message: 'course price is required',
                      });
                    }
                
                    // Validate categories array
                    if (!Array.isArray(categories) || categories.length === 0) {
                      return res.status(400).json({
                        success: false,
                        message: 'At least one category is required',
                      });
                    }
                
                    // Check for already existing treatment course using $regex
                    const exist_course = await treatement_course_model.findOne({
                      course_name: { $regex: `^${course_name}$`, $options: 'i' }, 
                    });
                    if (exist_course) {
                      return res.status(400).json({
                        success: false,
                        message: 'Course already exists with the same name',
                      });
                    }
                
                    // Validate for duplicate category names in the array
                    const uniqueCategories = new Set(categories);
                    if (uniqueCategories.size !== categories.length) {
                      return res.status(400).json({
                        success: false,
                        message: 'Duplicate category names are not allowed',
                      });
                    }
                
                    // Format categories
                    const formattedCategories = categories.map((category_name) => ({
                      category_name,
                    }));
                
                    // Logic to save the treatment course in the database
                    const new_course = new treatement_course_model({
                      course_name,
                      course_price,
                      categories: formattedCategories,
                    });
                    await new_course.save();
                
                    return res.status(200).json({
                      success: true,
                      message: 'Treatment course added successfully',
                     
                    });
                  } catch (error) {
                    return res.status(500).json({
                      success: false,
                      message: 'Server error',
                      error_message: error.message,
                    });
                  }
                };
                


        // Api for get all the treatement courses
        
        //  const get_all_treatment_courses = async( req , res )=> {
        //      try { 
        //                 // check for all treatment courses
                         
        //                 const treatments = await treatement_course_model.find({ }).sort({ createdAt : -1 }).lean()
        //                 if(!treatments)
        //                 {
        //                   return res.status(400).json({
        //                        success : false ,
        //                        message : 'No Treatment Course added yet'
        //                   })
        //                 }

        //                 return res.status(200).json({
        //                       success : true ,
        //                       message : 'all Treatement Course',
        //                       traement_course : treatments.map((t)=> ({
        //                                course_id : t._id,
        //                               course_name : t.course_name,
        //                               course_price :  t.course_price ,
        //                                categories : t.categories.map((c)=> ({
        //                                      category_name : c.category_name,
        //                                      category_id : c._id
        //                                }))
        //                       }))
        //                 })
        //      } catch (error) {
        //           return res.status(500).json({
        //                success : false ,
        //                message : 'Server error',
        //                error_message : error.message
        //           })
        //      }
        //  }

         // Api for get treatement course by id

         const get_treatment_course_by_id = async (req, res) => {
          try {
            const {treatment_course_id} = req.params;
            // Validate treatment_course_id
            if (!treatment_course_id) {
              return res.status(400).json({
                success: false,
                message: 'Treatment course ID is required.',
              });
            }

            // Check for treatment course existence
            const treatment_course = await treatement_course_model.findById(treatment_course_id);
            if (!treatment_course) {
              return res.status(400).json({
                success: false,
                message: 'Treatment course not found.',
              });
            }

            // Format the response
            const formattedCourse = {
              course_id: treatment_course._id,
              course_name: treatment_course.course_name,
              course_price: treatment_course.course_price,
              categories: treatment_course.categories.map((c) => ({
                category_name: c.category_name,
                category_id: c._id,
              })),

            };  

            return res.status(200).json({
              success: true,
              message: 'Treatment course details retrieved successfully.',
              treatment_course: formattedCourse,
            });
          } catch (error) {
            return res.status(500).json({
              success: false,
              message: 'Server error.',
              error_message: error.message,
            }); 
          }
        };
         
          // Api for update treatment Course price
                
      const update_treatment_course = async (req, res) => {
  try {
    const { treatment_course_id } = req.params;
    const { course_name, course_price, categories } = req.body;

    // Validate ID
    if (!treatment_course_id) {
      return res.status(400).json({
        success: false,
        message: 'Treatment course ID is required.',
      });
    }

    // Fetch course
    const treatment_course = await treatement_course_model.findById(treatment_course_id);
    if (!treatment_course) {
      return res.status(404).json({
        success: false,
        message: 'Treatment course not found.',
      });
    }

    // Update course_name
    if (course_name && course_name !== treatment_course.course_name) {
      treatment_course.course_name = course_name;
    }

    // Update course_price
    if (course_price && course_price !== treatment_course.course_price) {
      if (isNaN(course_price) || course_price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid course price. It must be a positive number.',
        });
      }
      treatment_course.course_price = course_price;
    }

    // Update specific categories by ID
    if (categories && Array.isArray(categories)) {
      for (const categoryUpdate of categories) {
        const { category_id, category_name } = categoryUpdate;

        if (!category_id || !category_name) {
          return res.status(400).json({
            success: false,
            message: 'Each category update must include category_id and category_name.',
          });
        }

        const existingCategory = treatment_course.categories.id(category_id);
        if (existingCategory) {
          existingCategory.category_name = category_name;
        } else {
          return res.status(404).json({
            success: false,
            message: `Category with ID ${category_id} not found.`,
          });
        }
      }
    }

    await treatment_course.save();

   return res.status(200).json({
  success: true,
  message: 'Treatment course updated successfully.',
  data: {
    _id: treatment_course._id,
    course_name: treatment_course.course_name,
    course_price: treatment_course.course_price,
    createdAt: treatment_course.createdAt,
    updatedAt: treatment_course.updatedAt,
    categories: treatment_course.categories.map(cat => ({
      category_name: cat.category_name,
      category_id: cat._id
    }))
  }
});


  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error.',
      error_message: error.message,
    });
  }
};


          
      // Api for delete particular treatement course
      const delete_treatment_course = async ( req , res )=> {
            try {
                    const courseId = req.params.courseId
                    // check for id
                    if(!courseId)
                    {
                      return res.status(400).json({
                           success : false ,
                           message : 'Treatment Course Id Required'
                      })
                    }                  
                        
                    // check for course
                    const course = await treatement_course_model.findOne({
                           _id : courseId
                    })
                    if(!course)
                    {
                      return res.status(400).json({
                             success : false ,
                             message : 'No Treatment Course Found'
                      })
                    }
                    // check for treatment course is used 

                    const check_course = await patientModel.find({ 
                      treatment_course_id :  courseId,  
                      patient_type: { $ne: 'Completed' }
                    });
                    if (check_course.length > 0) {
                      return res.status(400).json({
                          success: false,
                          message: `You can't delete the treatment course, some patients are having this treatment.`
                      });
                  }
                    
                  await course.deleteOne()
                      return res.status(200).json({
                           success : true ,
                           message : 'Treatment Course deleted successfully'
                      })
            } catch (error) {
                 return res.status(500).json({
                     success : false ,
                     message : 'Server error',
                     error_message : error.message
                 })
            }   
      }

                                                                /* treatment Section  */

          // Api for create treatment
          // const create_treatment = async (req, res) => {
          //   try {
          //     const {
          //       patientId,
          //       treatment_course_id,
          //       services,
          //       amount_paid,
          //       paymentMethod,
          //     } = req.body;
          
          //     // Check for required fields
          //     if (!patientId) {
          //       return res.status(400).json({
          //         success: false,
          //         message: 'patient Id Required',
          //       });
          //     }
          
          //     if (!treatment_course_id) {
          //       return res.status(400).json({
          //         success: false,
          //         message: 'treatment Course Id Required',
          //       });
          //     }
          
          //     // Fetch patient
          //     const patient = await patientModel.findOne({ patientId });
          //     if (!patient) {
          //       return res.status(400).json({
          //         success: false,
          //         message: 'Patient Not found',
          //       });
          //     }
          
          //     // Fetch treatment course
          //     const treatment_course = await treatement_course_model.findOne({ _id: treatment_course_id });
          //     if (!treatment_course) {
          //       return res.status(400).json({
          //         success: false,
          //         message: 'Treatment Course Not Found',
          //       });
          //     }
          
          //     const totalCharge = treatment_course.course_price;
          
          //     // Validate payment
          //     if (amount_paid <= 0 || amount_paid > totalCharge) {
          //       return res.status(400).json({
          //         success: false,
          //         message: 'Paid amount must be greater than 0 and not more than total charge',
          //       });
          //     }
          
          //     // Check if patient is confirmed
          //     if (patient.patient_status !== 'Confirmed') {
          //       return res.status(400).json({
          //         success: false,
          //         message: 'Please confirm the patient before creating treatment',
          //       });
          //     }
          
          //     // Check for existing active treatment
          //     const existingTreatment = await treatmentModel.findOne({
          //       patientId,
          //       treatment_course_name: treatment_course.course_name,
          //       status: { $ne: 'Complete' },
          //     });
          
          //     if (existingTreatment) {
          //       return res.status(400).json({
          //         success: false,
          //         message: 'Treatment already exists for the patient',
          //       });
          //     }
          
          //     // Validate and fetch services (optional)
          //     let fetchedServices = [];
          //     if (services && Array.isArray(services) && services.length > 0) {
          //       const servicePromises = services.map((serviceId) =>
          //         serviceModel.findOne({ serviceId })
          //       );
          //       const serviceResults = await Promise.all(servicePromises);
          
          //       for (const service of serviceResults) {
          //         if (!service) {
          //           return res.status(400).json({
          //             success: false,
          //             message: 'One or more services not found',
          //           });
          //         }
          
          //         fetchedServices.push({
          //           serviceId: service.serviceId,
          //           serviceName: service.serviceName,
          //           price: service.price,
          //           duration: service.duration,
          //         });
          //       }
          //     }
          
          //     // Create treatment record
          //     const treatmentId = `Tx-${generateRandomNumber(5)}`;
          //     const new_data = new treatmentModel({
          //       treatment_id: treatmentId,
          //       patientId,
          //       patient_name: patient.patient_name,
          //       treatment_course_id,
          //       totalCharge,
          //       treatment_course_name: treatment_course.course_name,
          //       services: fetchedServices,
          //       hospital: [],
          //       appointments: [],
          //       payment_details: [],
          //     });
          
          //     // Update patient record
          //     if (fetchedServices.length > 0) {
          //       patient.services = patient.services.concat(fetchedServices);
          //     }
          //     patient.treatment_course_name = treatment_course.course_name;
          //     patient.treatmentCount += 1;
          //     await patient.save();
          
          //     // Add payment info
          //     new_data.payment_details.push({
          //       paid_amount: amount_paid,
          //       paymentMethod,
          //       payment_Date: new Date(),
          //     });
          
          //     // Calculate due payment
          //     new_data.duePayment = totalCharge - amount_paid;
          
          //     await new_data.save();
          
          //     return res.status(200).json({
          //       success: true,
          //       message: 'Patient Treatment Record saved successfully',
          //       patientId,
          //     });
          //   } catch (error) {
          //     return res.status(500).json({
          //       success: false,
          //       message: 'Server error',
          //       error_message: error.message,
          //     });
          //   }
          // };
          
          const create_treatment = async (req, res) => {
            try {
              const {
                patientId,
                treatment_course_id,
                amount_paid,
                paymentMethod,
                services
              } = req.body;
          
              if (!patientId || !treatment_course_id) {
                return res.status(400).json({
                  success: false,
                  message: 'patientId and treatment_course_id are required',
                });
              }
          
              const patient = await patientModel.findOne({ patientId });
              if (!patient) {
                return res.status(400).json({ success: false, message: 'Patient Not Found' });
              }
          
              const treatment_course = await treatement_course_model.findOne({ _id: treatment_course_id });
              if (!treatment_course) {
                return res.status(400).json({ success: false, message: 'Treatment Course Not Found' });
              }
          
              if (patient.patient_status !== 'Confirmed') {
                return res.status(400).json({
                  success: false,
                  message: 'Please confirm the patient before creating treatment',
                });
              }
          
              /* const treatment_charge = treatment_course.course_price;
          
              // Fetch free services from new freeServiceModel
              const freeServicesFromDB = await serviceModel.find({});
              const freeServices = freeServicesFromDB.map(service => ({
                serviceId: service.serviceId,
                serviceName: service.serviceName,
                duration: service.duration,
                service_type: "Free"
              })); */
              const treatment_charge = treatment_course.course_price;
              const freeServicesFromDB = await serviceModel.find({
                serviceId: { $in: services } // match IDs
              });
              
              // Map the results into the desired structure
              const freeServices = freeServicesFromDB.map(service => ({
                serviceId: service.serviceId,
                serviceName: service.serviceName,
                duration: service.duration,
                service_type: "Free"
              }));
          
              const totalCharge = treatment_charge; // At this point, only treatment_charge is included. Paid services come from extra API.
          
              if (amount_paid <= 0) {
                return res.status(400).json({
                  success: false,
                  message: 'Please enter a valid paid amount to choose a payment method',
                });
              }
          
              if (amount_paid > totalCharge) {
                return res.status(400).json({
                  success: false,
                  message: 'Paid amount must not be more than the total charge',
                });
              }
          
              const existingTreatment = await treatmentModel.findOne({
                patientId,
                treatment_course_name: treatment_course.course_name,
                status: { $ne: 'Complete' },
              });
          
              if (existingTreatment) {
                return res.status(400).json({
                  success: false,
                  message: 'Treatment already exists for the patient',
                });
              }
          
              const treatmentId = `Tx-${generateRandomNumber(5)}`;
              const newTreatment = new treatmentModel({
                treatment_id: treatmentId,
                patientId,
                patient_name: patient.patient_name,
                treatment_course_id,
                treatment_course_name: treatment_course.course_name,
                treatment_course_fee : treatment_charge,
                treatment_charge,
                totalCharge,
                duePayment: totalCharge - amount_paid,
                services: freeServices, // paid services will be added later via `patient_extra_service` API
                hospital: [],
                appointments: [],
                payment_details: [{
                  paid_amount: amount_paid,
                  paymentMethod,
                  payment_Date: new Date(),
                }],
              });
          
              // Update patient
              patient.services = (patient.services || []).concat(freeServices);
              patient.treatment_course_name = treatment_course.course_name;
              patient.treatmentCount += 1;
              await patient.save();
          
              await newTreatment.save();
          // ✅ Send WhatsApp Message
    const waMessage = `Hello ${patient.patient_name}, your treatment "${treatment_course.course_name}" has been successfully created.\nTotal Charge: ₹${treatment_charge}\nAmount Paid: ₹${amount_paid}\nThank you for choosing us!`;

    if (patient.emergency_contact_no) {
      
      try {
        const whatsappResult = await sendWhatsAppMessage(`${patient.phoneCode}${patient.emergency_contact_no}`, waMessage);
        // Optional: Log or return WhatsApp status if needed
        console.log(whatsappResult);
        
      } catch (waErr) {
        console.error("WhatsApp Error:", waErr.message);
      }
    }
              return res.status(200).json({
                success: true,
                message: 'Patient Treatment Record saved successfully',
                patientId,
              });
            } catch (error) {
              return res.status(500).json({
                success: false,
                message: 'Server error',
                error_message: error.message,
              });
            }
          };
          
          

          const update_treatment_status = async (req, res) => {
            console.log(req.body)
            try {
              const { treatment_id } = req.params;
              const { status } = req.body;
          
              // Validate treatment_id
              if (!treatment_id) {
                return res.status(400).json({
                  success: false,
                  message: "Treatment ID is required",
                });
              }
          
              // Exclude 'Pending' from valid status updates
              if (!["InProgress", "Complete", "Cancelled"].includes(status)) {
                return res.status(400).json({
                  success: false,
                  message: "Invalid status. You can only update to InProgress, Complete, or Cancelled.",
                });
              }
          
              // Find the treatment
              const treatment = await treatmentModel.findOne({ treatment_id });
              if (!treatment) {
                return res.status(404).json({
                  success: false,
                  message: "Treatment not found",
                });
              }
          
              // Update status
              treatment.status = status;
              await treatment.save();
          
              return res.status(200).json({
                success: true,
                message: "Treatment status updated successfully",
                data: treatment,
              });
            } catch (error) {
              return res.status(500).json({
                success: false,
                message: "Server error",
                error_message: error.message,
              });
            }
          };
          
      // Api for get patient treatment 
       
          const get_patient_treatment = async ( req , res )=> {
              try {
                      const patientId = req.params.patientId
                // check for patientId
                if(!patientId)
                {
                  return res.status(400).json({
                       success : false ,
                       message : 'Patient Id Required'
                  })
                }

                // check for patient 
                const patient = await patientModel.findOne({ patientId : patientId })
                if(!patient)
                {
                  return res.status(400).json({
                       success : false ,
                       message : 'Patient Not Found'
                  })
                }

                // check for the treatment detail of the patient
                const patient_treatment_details = await treatmentModel.find({ patientId })
                if(!patient_treatment_details)
                {
                  return res.status(400).json({
                       success : false ,
                       message : 'No patient treatment Record Found'
                  })
                }
                       
                return res.status(200).json({
                     success : true ,
                     message : 'Patient Treatements',
                     patient_treatments : patient_treatment_details.map((t)=> ({
                            treatmentId : t.treatment_id ,
                            patientId : t.patientId,
                            services : t.services,
                            freeServices : t.freeServices,
                            patient_name : t.patient_name,
                            duePayment : t.duePayment,
                            treatment_name : t.treatment_course_name,
                            treatment_id: t.treatment_course_id,
                            totalCharge : t.totalCharge ,
                            treatment_status : t.status,
                            all_appointments : t.appointments.map((a)=> ({
                                           appointmentId : a.appointmentId,
                                           appointment_Date : a.appointment_Date,
                            })),
                            hospital_Name: (t.hospital?.[0]?.hospital_Name) || '',
                           
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

          const get_unadded_services_for_treatment = async (req, res) => {
            try {
              const { treatmentId } = req.params;
          
              if (!treatmentId) {
                return res.status(400).json({
                  success: false,
                  message: 'Treatment Id is required',
                });
              }
          
              // Find treatment by treatment_id
              const treatment = await treatmentModel.findOne({ treatment_id: treatmentId });
              if (!treatment) {
                return res.status(404).json({
                  success: false,
                  message: 'Treatment not found',
                });
              }
          // console.log(treatment);
          
          // Fetch only active services
          const allActiveServices = await serviceModel.find({ isActive:1 });
          
          // Get serviceIds already added in treatment
          const addedServiceIds = treatment.services.map((s) => s.serviceId);
          console.log(addedServiceIds);
          
          // Filter out services that are already added
          const unaddedServices = allActiveServices.filter(
            (service) => !addedServiceIds.includes(service.serviceId)
          );
          console.log(unaddedServices);
          
              return res.status(200).json({
                success: true,
                message: 'Active unadded services fetched successfully',
                availableServices: unaddedServices.map((s) => ({
                  serviceId: s.serviceId,
                  serviceName: s.serviceName,
                  price: s.price,
                  duration: s.duration,
                })),
              });
          
            } catch (error) {
              return res.status(500).json({
                success: false,
                message: 'Server error',
                error_message: error.message,
              });
            }
          };
          

   // Api for add patient in hospital
   const assign_patient_to_hospital = async (req, res) => {
    try {
            const { patientId } = req.params;
            const { hospitalId , treatmentId , hospital_charge } = req.body ;

            // Check for patientId
            if (!patientId) {
                return res.status(400).json({
                    success: false,
                    message: 'Patient Id Required'
                });
            }

        // Check for patient
            const patient = await patientModel.findOne({ patientId: patientId });
            if (!patient) {
                return res.status(400).json({
                    success: false,
                    message: 'Patient not Found'
                });
            }

        // Check for hospitalId
            if (!hospitalId) {
                return res.status(400).json({
                    success: false,
                    message: 'Hospital Id Required' 
                });
            }
          // check for treatment 
          
              const treatment = await treatmentModel.findOne({ treatment_id : treatmentId })
              if(!treatment)
              {
                  return res.status(400).json({
                      success : false ,
                      message :  'Patient Treatment Record not Found'
                  })
              }

        // Check for hospital
              const hospital = await hospitalModel.findOne({ _id: hospitalId });
              if (!hospital) {
                  return res.status(400).json({
                      success: false,
                      message: 'Hospital Not Found'
                  });
              }

               if(patient.patient_status === 'Confirmed') 
               {                          

              const newAssignment = {
                  patientId: patientId,
                  Assigned_Date: new Date()
              };

              hospital.PatientAssigned.push(newAssignment); 
              await hospital.save();
                    
                    if (!Array.isArray(treatment.hospital)) {
                      treatment.hospital = [];
                    }
                    
                    treatment.hospital.push({                          
                                  
                                  hospital_id: hospitalId,
                                  hospital_Name: hospital.hospitalName,
                                  hospital_charge : hospital_charge
                            
                    });                   
            
            // Save the updated treatment document
            await treatment.save();         
           
              return res.status(200).json({
                  success: true,
                  message: 'Patient assigned to Hospital successfully'
              });
                      }

                          } catch (error) {
                              return res.status(500).json({
                                  success: false,
                                  message: 'Server error',
                                  error_message: error.message
                              });
                          }
                      };


            // Api for update treatment status
            const update_patient_treatment_status = async( req , res )=> {
                   try {
                          const treatment_id = req.params.treatment_id
                          let status = req.body.status

                          if(!treatment_id)
                          {
                            return res.status(400).json({
                                  success : false ,
                                  message : 'Treatment Id Required'
                            })
                          }                             

                          // check for status
                         
                        if (status === undefined || typeof status !== "number") {
                          return res.status(400).json({
                            success: false,
                            message: "Valid status is required",
                          });
                        }

                        // check for treatment 
                        const treatment = await treatmentModel.findOne({ treatment_id })
                        if(!treatment)
                        {
                          return res.status(400).json({
                               success : false ,
                               message : 'treatment Details not Found'
                          })
                        }

                        const statusMappings = {
                          1: { status : 'Schedule' },
                          2: { status : 'Follow-Up' },
                          3: { status : 'Complete' },
                        }

                        // update status
                        const updateData = statusMappings[status]
                        if(!updateData)
                        {
                             return res.status(400).json({
                                 success : false ,
                                 message : 'Invalid Status Value'
                             })
                        }

                        Object.assign(treatment , updateData)

                        await treatment.save()

                        return res.status(200).json({
                              success : true ,
                              message : 'Patient Treatment Status Updated'
                        })


                   } catch (error) {
                        return res.status(500).json({
                             success : false ,
                             message : 'Server error',
                             error_message : error.message
                        })
                   }
            }
               

            
                 
                        
                                                           /* Report Section */

      //     const exportfilteredpatient = async (req, res) => {
      //     try {
      //         const userId = req.params.userId;
      //         const { startDate, endDate , treatment_name, age  } = req.query;
      
      //         if (startDate || endDate) {
      //           filter.createdAt = {};
      //           if (startDate) filter.createdAt.$gte = new Date(startDate);
      //           if (endDate) filter.createdAt.$lte = new Date(endDate);
      //         }
          
      //         // Check for userId
      //         if (!userId) {
      //             return res.status(400).json({
      //                 success: false,
      //                 message: 'userId is required',
      //             });
      //         }
              
      //         // Check for user existence
      //         const user = await userModel.findOne({ _id: userId });
      //         if (!user) {
      //             return res.status(400).json({
      //                 success: false,
      //                 message: 'user not found',
      //             });
      //         }
      
      //         // Construct filter for applied job patients
      //         const filter = {};     
              
      
      //         // Gender filter
      //         if (gender) {
      //             filter.gender = gender;
      //         }
      
      //         // Construct regex-based filters for country and treatment_name
      //         if (country) {
      //             filter.country = { $regex: country , $options: 'i' }; 
      //         }
      //         if (treatment_name) {
      //           filter['patient_disease.disease_name'] = { $regex: treatment_name, $options: 'i' }; 
      //         }
      //         if (age) {
      //             filter.age = age ; 
      //         }
      
      //         // Fetch patients
      //         const totalpatients = await patientModel.find({ ...filter });
      //         if (totalpatients.length === 0) { 
      //             return res.status(400).json({
      //                 success: false,
      //                 message: 'No patient found ',
      //             }); 
      //         }          
                  
      //             // Create Excel workbook and worksheet
      //         const workbook = new ExcelJs.Workbook();              
      //         const worksheet = workbook.addWorksheet("patients");
      
      //         // Define Excel header
      //         worksheet.columns = [
      //             { header: "Patient Id", key: "patientId", width: 15 },
      //             { header: "Patient Name", key: "patient_name", width: 15 },
      //             { header: "Patient Email", key: "email", width: 25 },
      //             { header: "Country", key: "country", width: 15 },
      //             { header: "Emergency Contact Number", key: "emergency_contact_no", width: 15 },                 
      //             { header: "Gender", key: "gender", width: 10 },                
      //             { header: "Patient Disease", key: "patient_disease", width: 50 },                  
      //         ];
      
      //         // Add data to the worksheet
      //         totalpatients.forEach(patient => {
      //             worksheet.addRow({
      //               patientId: patient.patientId,
      //               patient_name: patient.patient_name,
      //                 user_Email: patient.user_Email,
      //                 email: patient.email,
      //                 country: patient.country,
      //                 emergency_contact_no: patient.emergency_contact_no,                   
      //                 gender: patient.gender,                 
      //                 patient_disease: patient.patient_disease[0].disease_name
                                         
      //             });
      //         });                 

      
      //         // Set response headers for downloading the Excel file
      //         res.setHeader(
      //             "Content-Type",
      //             "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      //         );
      //         res.setHeader(
      //             "Content-Disposition",
      //             `attachment; filename=patientsData.xlsx`
      //         );
      
      //         // Generate and send the Excel file as a response
      //         await workbook.xlsx.write(res);
      
      //         // End the response
      //         res.end();             
      
              
      //     } catch (error) {
      //         console.error("Error exporting patients:", error);
      //         res.status(500).json({
      //             success: false,
      //             message: 'Server error',
      //             error_message: error.message,
      //         });
      //     }
      // };
 //js



 const fs = require('fs');
 const path = require('path');

 
 const exportfilteredpatient = async (req, res) => {
   try {
     const { startDate, endDate, treatment_course_name, country, age } = req.query;
 
     let filter = {};
 
     if (startDate || endDate) {
       filter.createdAt = {};
       if (startDate) {
         const start = new Date(startDate);
         if (!isNaN(start)) filter.createdAt.$gte = start;
         else return res.status(400).json({ success: false, message: 'Invalid startDate format' });
       }
       if (endDate) {
         const end = new Date(endDate);
         if (!isNaN(end)) filter.createdAt.$lte = end;
         else return res.status(400).json({ success: false, message: 'Invalid endDate format' });
       }
     }
 
     if (treatment_course_name) {
       filter.treatment_course_name = { $regex: treatment_course_name, $options: 'i' };
     }
 
     if (country) {
       filter.country = { $regex: country, $options: 'i' };
     }
 
     if (age) {
       const parsedAge = Number(age);
       if (isNaN(parsedAge)) return res.status(400).json({ success: false, message: 'Invalid age format' });
       filter.age = parsedAge;
     }
 
     const patients = await patientModel.find(filter).lean();
 
     if (!patients.length) {
       return res.status(404).json({ success: false, message: 'No matching patients found' });
     }
 
     const workbook = new ExcelJs.Workbook();
     const worksheet = workbook.addWorksheet("Filtered Patients");
 
     worksheet.columns = [
       { header: "Patient ID", key: "patientId", width: 15 },
       { header: "Patient Name", key: "patient_name", width: 20 },
       { header: "Email", key: "email", width: 25 },
       { header: "Country", key: "country", width: 15 },
       { header: "Gender", key: "gender", width: 10 },
       { header: "Emergency Contact", key: "emergency_contact_no", width: 20 },
       { header: "Age", key: "age", width: 10 },
       { header: "Treatment Course", key: "treatment_course_name", width: 20 },
       { header: "Date", key: "createdAt", width: 20 },
     ];
 
     patients.forEach(patient => {
       worksheet.addRow({
         patientId: patient.patientId || 'N/A',
         patient_name: patient.patient_name || 'N/A',
         email: patient.email || 'N/A',
         country: patient.country || 'N/A',
         gender: patient.gender || 'N/A',
         emergency_contact_no: patient.emergency_contact_no || 'N/A',
         age: patient.age || 'N/A',
         treatment_course_name: patient.treatment_course_name || 'N/A',
         createdAt: patient.createdAt || 'N/A',
       });
     });
 
     const filename = `filtered_patients_${Date.now()}.xlsx`;
     const filePath = path.join(__dirname, '..', '..', 'exports', filename);
 
     fs.mkdirSync(path.dirname(filePath), { recursive: true });
 
     await workbook.xlsx.writeFile(filePath);
 
     return res.status(200).json({
       success: true,
       message: 'Filtered patients retrieved successfully',
       data: patients,
       download_link: `/omca_crm/exports/${filename}`
     });
 
   } catch (error) {
     console.error("Error exporting patients:", error);
     return res.status(500).json({ success: false, message: "Server error", error_message: error.message });
   }
 };
 


      
// Api for get all patient according to diseases
const patientCount_year_wise = async (req, res) => {
  try {
      const checkAllPatient = await patientModel.find({});

      if (checkAllPatient.length === 0) {
          return res.status(400).json({
              success: false,
              message: 'No profiles found'
          });
      }

      // Get the current year
      const currentYear = new Date().getFullYear();


      const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];
      const patientByYear = {};
      years.forEach(year => {
      patientByYear[year] = {};
      });

      // Count checkAllPatient by year and disease
      checkAllPatient.forEach(pat => {
          const year = new Date(pat.createdAt).getFullYear();  
          const disease = pat.patient_disease[0]?.disease_name; 

          if (disease) {
            
              if (!patientByYear[year][disease]) {
                  patientByYear[year][disease] = 0;
              }
              patientByYear[year][disease]++;
          }
      });

  
      const allDiseases = new Set();
      checkAllPatient.forEach(pat => {
          const disease = pat.patient_disease[0]?.disease_name;
          if (disease) {
              allDiseases.add(disease);
          }
      });
    
      allDiseases.forEach(disease => {
          years.forEach(year => {
              if (!patientByYear[year].hasOwnProperty(disease)) {
                  patientByYear[year][disease] = 0;
              }
          });
      });

      return res.status(200).json({
          success: true,
          message: 'patient Count ',
          details: patientByYear
      });

  } catch (error) {
      return res.status(500).json({
          success: false,
          message: 'Server error',
          error_message: error.message
      });
  }
};



                                                        /* Dashboard Section */

      // APi for Dashboard
         
      const Dashboard_count = async (req, res) => {
        try {
            // Basic counts
            const totalStaff = await userModel.countDocuments({ role: { $ne: 'Admin' } });
            const totalHospital = await hospitalModel.countDocuments();
            const all_Enquiry = await enquiryModel.countDocuments({ enq_status: { $ne: 'Confirmed' } });
            const Patients = await patientModel.countDocuments({ patient_status: 'Confirmed' });
            const totalAppointment = await appointmentModel.countDocuments();
            const services = await serviceModel.countDocuments();
    
            // Earnings calculation
            const treatments = await treatmentModel.find({});
            let totalEarning = 0;
            let myEarning = 0;
            let sumTotalDue = 0;
            let hospitalCharge = 0;
    
            treatments.forEach((treatment) => {
                const totalCharge = treatment.totalCharge || 0;
                const totalDue = treatment.duePayment || 0;
                hospitalCharge += treatment.hospital?.[0]?.hospital_charge || 0;
                totalEarning += (totalCharge - totalDue);
                sumTotalDue += totalDue;
            });
    
            myEarning = totalEarning - hospitalCharge;
            let duePaymentAll = sumTotalDue;
    
            // 1. Total treatment courses
            const totalTreatmentCourses = await treatement_course_model.countDocuments();
    
            // 1. Get all treatment courses
// Get all treatment courses
// const allCourses = await treatement_course_model.find({}, 'course_name');

// 1. Get all treatment courses
const allCourses = await treatement_course_model.find({}, 'course_name');
const courseAssignments = {};

// // 2. Loop through each course and count how many patients have it assigned
// for (let course of allCourses) {
//     const courseName = course.course_name;
//     const count = await patientModel.countDocuments({ treatment_course_name: courseName });
//     courseAssignments[courseName] = count;
// }

// Prepare the key-value pairs for each course
let courseAssignmentCounts = {};
for (let course of allCourses) {
    const courseName = course.course_name;
    const count = await patientModel.countDocuments({ treatment_course_name: courseName });
    courseAssignmentCounts[courseName] = count;
}

    
            return res.status(200).json({
                success: true,
                message: 'Dashboard Count',
                totalStaff,
                totalHospital,
                services,
                all_Enquiry,
                Patients,
                totalAppointment,
                OMCA_total_Earning: myEarning,
                duePaymentAll,
                totalTreatmentCourses,
                // courseAssignments
                ...courseAssignmentCounts 
            });
    
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Server error',
                error_message: error.message
            });
        }
    };
    
      
                                                              /* service Section */
                
          // Api for add new service
             const add_service = async( req , res)=> {
                  try {
                       
                        const { serviceName , description ,  price , duration   } = req.body

                        // check for required Fields

                        const requiredFields = ['serviceName' , 'description' , 'price' , 'duration']
                        for( let field of requiredFields)
                        {
                                if(!req.body[field])
                                {
                                      return res.status(400).json({
                                           success : false ,
                                           message : `Required ${field.replace('_' , ' ')}`
                                      })
                                }
                        }

                        // check for service exist

                          const existService = await serviceModel.findOne({ serviceName : { $regex: `^${serviceName}$`, $options: 'i' } })
                          if(existService)
                          {
                              return res.status(400).json({
                                   success : false ,
                                   message  : `Service already Exist : ${serviceName}`
                              })
                          }
                          else
                          {

                                   const serviceId = `Svc-${generateRandomNumber(5)}`
                                   // add new service
                                   const newService = new serviceModel({
                                       serviceId : serviceId,
                                       serviceName,
                                       description,
                                       price ,
                                       duration

                                        
                                   })

                                   await newService.save()

                                   return res.status(200).json({
                                        success : true ,
                                        message : 'New Service addedd'
                                   })
                          }
                  } catch (error) {
                      return res.status(500).json({
                           success : false ,
                           message : 'Server error',
                           error_message : error.message
                      })
                  }
             }
                    

        // Api for get all services
            const all_services = async ( req , res )=> {
                 try {
                        const services = await serviceModel.find({ }).sort({ createdAt : -1 }).lean()
                        
                        if(!services)
                        {
                             return res.status(400).json({
                                  success : false ,
                                  message : 'No Services added yet'
                             })
                        }

                        return res.status(200).json({
                             success : true ,
                             message : 'All Services',
                             services : services.map((s)=> ({
                                   serviceId : s.serviceId,
                                   serviceName : s.serviceName,
                                   description : s.description,
                                   price : s.price,
                                   duration : s.duration,
                                   isActive : s.isActive
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


        // Api for active inactive service

                   const active_inactive_Service = async( req , res )=> {
                        try {
                               const serviceId = req.params.serviceId
                               // check for service ID

                               if(!serviceId)
                               {
                                  return res.status(400).json({
                                       success : false ,
                                       message : 'Service Id Required'
                                  })
                               }

                               // check for service
                               const service = await serviceModel.findOne({
                                     serviceId : serviceId
                               })
                               if(!service)
                               {
                                  return res.status(400).json({
                                       success : false ,
                                       message : 'Service not Found'
                                  })
                               }           

                               let message = ''
                               if(service.isActive === 1)
                               {
                                service.isActive = 0
                                     message = `service : ${service.serviceId} is Inactive`
                               }
                               else 
                               {
                                      service.isActive = 1
                                     message = `service : ${service.serviceId} is Active`
                               }

                                  await service.save()

                               return res.status(200).json({
                                    success : true ,
                                    message : message
                               })

                        } catch (error) {
                              return res.status(500).json({
                                   success : false ,
                                   message : 'Server error',
                                   error_message : error.message
                              })
                        }
                   }


          // Api for get all active services

              const get_activeServices = async( req , res)=> {
                try {
                  const services = await serviceModel.find({ isActive : 1 }).sort({ createdAt : -1 }).lean()
                  
                  if(!services)
                  {
                       return res.status(400).json({
                            success : false ,
                            message : 'No Services added yet'
                       })
                  }

                  return res.status(200).json({
                       success : true ,
                       message : 'All Services',
                       services : services.map((s)=> ({
                             serviceId : s.serviceId,
                             serviceName : s.serviceName,
                             description : s.description,
                             price : s.price,
                             duration : s.duration,
                             isActive : s.isActive
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

              
              // Api for create free service

              const add_free_service = async (req, res) => {
    try {
        const { serviceName, description, duration } = req.body;

        // check for required fields
        const requiredFields = ['serviceName', 'description', 'duration'];
        for (let field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    message: `Required ${field.replace('_', ' ')}`,
                });
            }
        }

        // check for service existence
        const existService = await freeServiceModel.findOne({
            serviceName: { $regex: `^${serviceName}$`, $options: 'i' },
        });

        if (existService) {
            return res.status(400).json({
                success: false,
                message: `Free service already exists: ${serviceName}`,
            });
        }

        const serviceId = `F-Svc-${generateRandomNumber(5)}`;

        // create new free service
        const newFreeService = new freeServiceModel({
            serviceId,
            serviceName,
            description,
            duration,
        });

        await newFreeService.save();

        return res.status(200).json({
            success: true,
            message: 'New free service added',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error_message: error.message,
        });
    }
};

      // Api for add kyc details
       const patient_Kyc_details = async( req , res)=> {
             try {
                     const patientId = req.params.patientId
                     // check for patientId
                     if(!patientId)
                     {
                      return res.status(400).json({
                           success : false ,
                           message : 'PatientId Required'
                      })
                     }
                         
                     // check for patient
                     const patient = await patientModel.findOne({
                           patientId : patientId
                     })

                     if(!patient)
                     {
                      return res.status(400).json({
                           success : false,
                           message : 'patient Not Found'
                      })
                     }

                     // add kyc details
                     const newKycDetails = {};

                     if (req.files.id_proof) {
                      newKycDetails.id_proof = req.files.id_proof[0].filename;
                  }
                  if (req.files.passport) {
                      newKycDetails.passport = req.files.passport[0].filename;
                  }
                  if (req.files.photo) {
                      newKycDetails.photo = req.files.photo[0].filename;
                  }
          
                  patient.Kyc_details.push(newKycDetails);
                  await patient.save();

                  return res.status(200).json({
                        success : true  ,
                        message : 'patient kyc details added'
                  })
                        
                            
             } catch (error) {
                  return res.status(500).json({
                       success : false ,
                       message : 'Server error' ,
                       error_message : error.message
                  })
             }
       }
            

       const update_service = async (req, res) => {
        try {
            const serviceId = req.params.serviceId;
            const { serviceName, description, price, duration } = req.body;

            // Check for serviceId
            if (!serviceId) {
                return res.status(400).json({
                    success: false,
                    message: 'Service ID required',
                });
              }
                const service = await serviceModel.findOne({ serviceId: serviceId });
                if (!service) {
                    return res.status(400).json({     
                        success: false,
                        message: 'Service not found',
                    });
                }

                service.serviceName = serviceName || service.serviceName;
                service.description = description || service.description; 
                service.price = price || service.price;
                service.duration = duration || service.duration;

                service.save()

                return res.status(200).json({
                    success: true,
                    message: 'Service updated successfully',
                });

        }catch(error){
            return res.status(500).json({
                success: false,
                message: 'Server error',
                error_message: error.message
            });
        }
      
    }

    // Api for paid service


    const paid_service = async (req, res) => {
      try {
        // Fetch only services where price is not 0
        const paidServices = await serviceModel.find({ price: { $ne: 0 } });
    
        if (!paidServices || paidServices.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'No paid services found',
          });
        }
    
        return res.status(200).json({
          success: true,
          message: 'Paid services retrieved successfully',
          data: paidServices,
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Server error',
          error_message: error.message,
        });
      }
    };
    


    // Api for delete service
    const delete_service = async (req, res) => {
        try {
            const serviceId = req.params.serviceId;
            // Check for serviceId
            if (!serviceId) {
                return res.status(400).json({
                    success: false,
                    message: 'Service ID required',
                });
            }
            // Check for service existence

            const deleteService = await serviceModel.findOne({ serviceId: serviceId });
            if (!deleteService) {
                return res.status(400).json({
                    success: false,
                    message: 'Service not found',
                });
            }
            // Delete the service
            await serviceModel.deleteOne({ serviceId: serviceId });
            return res.status(200).json({
                success: true,
                message: 'Service deleted successfully',
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Server error',
                error_message: error.message
            }); 
        }
    }

    // Api for add extra services for patient

    // const patient_extra_service = async (req, res) => {
    //   try {
    //     const patientId = req.params.patientId;
    //     const { services} = req.body;
    
    //     console.log('Request Body:', req.body);
    
    //     // Check for patientId
    //     if (!patientId) {
    //       return res.status(400).json({
    //         success: false,
    //         message: 'Patient ID required',
    //       });
    //     }
    
    //     // Find the patient
    //     const patient = await patientModel.findOne({ patientId: patientId });
    
    //     if (!patient) {
    //       return res.status(400).json({
    //         success: false,
    //         message: 'Patient not found',
    //       });
    //     }
    
    //     // Log current services before modification
    //     console.log("Existing Services:", patient.services);
    
    //     let fetchedServices = [];
    
    //     // Check if services are provided
    //     if (services) {
    //       // Validate the services array
    //       if (!Array.isArray(services) || services.length === 0) {
    //         return res.status(400).json({
    //           success: false,
    //           message: 'At least one service is required',
    //         });
    //       }
    
    //       // Loop through each service to fetch serviceName
    //       for (let service of services) {
    //         const { serviceId, price } = service;
    
    //         const serviceData = await serviceModel.findOne({ serviceId });
    
    //         if (!serviceData) {
    //           return res.status(400).json({
    //             success: false,
    //             message: `Service with serviceId : ${serviceId} not found`,
    //           });
    //         }
    
    //         fetchedServices.push({
    //           serviceId: serviceId,
    //           serviceName: serviceData.serviceName,
    //           price: serviceData.price || price, // Use the provided price if available
    //         });
    //       }
    //     }
    
    //     console.log(fetchedServices)
    //     console.log(patient.services);
        
    //     // Add the new services to the patient's services without replacing the old ones
    //     patient.services = [...patient.services, ...fetchedServices]; // Ensure new services are appended
    //     patient.serviceCount = patient.services.length; // Update serviceCount after adding the new services
    
    //     // Log the updated services
    //     console.log("Updated Services:", patient.services);
    
    //     // Save the patient with the updated services
    //     await patient.save();
    
    //     console.log(patient.services);

    //     return res.status(200).json({
    //       success: true,
    //       message: 'Extra services added successfully',
    //     });
    //   } catch (error) {
    //     console.error('Error:', error);
    //     return res.status(500).json({
    //       success: false,
    //       message: 'Server error',
    //       error_message: error.message,
    //     });
    //   }
    // };
    
    // const patient_extra_service2 = async (req, res) => {
    //   try {
    //     const patientId = req.params.patientId;
    //     const { services } = req.body;
    
    //     if (!patientId) {
    //       return res.status(400).json({
    //         success: false,
    //         message: 'Patient ID required',
    //       });
    //     }
    
    //     const patient = await patientModel.findOne({ patientId });
    //     if (!patient) {
    //       return res.status(400).json({
    //         success: false,
    //         message: 'Patient not found',
    //       });
    //     }
    
    //     if (!Array.isArray(services) || services.length === 0) {
    //       return res.status(400).json({
    //         success: false,
    //         message: 'At least one service is required',
    //       });
    //     }
    
    //     let fetchedServices = [];
    
    //     for (let service of services) {
    //       const { serviceId, price } = service;
    
    //       const serviceData = await serviceModel.findOne({ serviceId });
    //       if (!serviceData) {
    //         return res.status(400).json({
    //           success: false,
    //           message: `Service with serviceId: ${serviceId} not found`,
    //         });
    //       }
    
    //       fetchedServices.push({
    //         serviceId,
    //         serviceName: serviceData.serviceName,
    //         price: price ?? serviceData.price,
    //       });
    //     }
    
    //     // ✅ Update patient services
    //     patient.services = [...(patient.services || []), ...fetchedServices];
    //     patient.serviceCount = patient.services.length;
    //     await patient.save();
    
    //     // ✅ Also update treatment record for this patient
    //     const activeTreatment = await treatmentModel.findOne({
    //       patientId,
    //       status: { $ne: 'Complete' }
    //     });
    
    //     if (!activeTreatment) {
    //       return res.status(400).json({
    //         success: false,
    //         message: 'Active treatment not found for this patient',
    //       });
    //     }
    
    //     // Add services to treatment.services
    //     activeTreatment.services = [...(activeTreatment.services || []), ...fetchedServices];
    
    //     // Increase totalCharge and duePayment
    //     const additionalCharge = fetchedServices.reduce((sum, s) => sum + (s.price || 0), 0);
    //     activeTreatment.totalCharge += additionalCharge;
    //     activeTreatment.duePayment += additionalCharge;
    
    //     await activeTreatment.save();
    
    //     return res.status(200).json({
    //       success: true,
    //       message: 'Extra services added successfully to patient and treatment',
    //     });
    //   } catch (error) {
    //     console.error('Error:', error);
    //     return res.status(500).json({
    //       success: false,
    //       message: 'Server error',
    //       error_message: error.message,
    //     });
    //   }
    // };

    const patient_extra_service = async (req, res) => {
      try {
        const treatment_id = req.params.treatment_id;
        const { services } = req.body;
        console.log('Services:', services);

        if (!treatment_id) {
          return res.status(400).json({
            success: false,
            message: 'Treatment ID is required',
          });
        }
    
        if (!services || typeof services !== 'object') {
          return res.status(400).json({
            success: false,
            message: 'Service data must be an object',
          });
        }
    
        const { serviceId, price } = services;
    
        if (!serviceId) {
          return res.status(400).json({
            success: false,
            message: 'Service ID is required',
          });
        }
    
        // Fetch treatment
        const treatment = await treatmentModel.findOne({ treatment_id });
        if (!treatment) {
          return res.status(404).json({
            success: false,
            message: 'Treatment not found',
          });
        }
    
        // Fetch patient
        const patient = await patientModel.findOne({ patientId: treatment.patientId });
        if (!patient) {
          return res.status(404).json({
            success: false,
            message: 'Patient linked to this treatment not found',
          });
        }
    
        // Fetch service details
        const serviceData = await serviceModel.findOne({ serviceId });
        if (!serviceData) {
          return res.status(404).json({
            success: false,
            message: `Service with serviceId: ${serviceId} not found`,
          });
        }
    
        const finalService = {
          serviceId,
          serviceName: serviceData.serviceName,
          price: price ?? serviceData.price,
          service_type : "Paid"
        };
    
        // Update patient
        patient.services = [...(patient.services || []), finalService];
        patient.serviceCount = patient.services.length;
        await patient.save();
    
        // Update treatment
        treatment.services = [...(treatment.services || []), finalService];
        treatment.totalCharge += finalService.price || 0;
        treatment.duePayment += finalService.price || 0;
        await treatment.save();
    
        return res.status(200).json({
          success: true,
          message: 'Extra service added successfully.',
        });
      } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
          success: false,
          message: 'Server error',
          error_message: error.message,
        });
      }
    };
    
    
    
    // Api for add payment record in the treatment

    const add_new_treatment_payment = async (req, res) => {
      try {
        const { treatment_id } = req.params;
        const { paid_amount, paymentMethod, payment_Date } = req.body;
    
        // Validate required fields
        const requiredFields = ['paid_amount', 'paymentMethod', 'payment_Date'];
        for (let field of requiredFields) {
          if (!req.body[field]) {
            return res.status(400).json({
              success: false,
              message: `Required ${field.replace('_', ' ')}`,
            });
          }
        }
    
        if (!treatment_id) {
          return res.status(400).json({
            success: false,
            message: "Treatment ID is required",
          });
        }
    
        // Fetch treatment by treatment_id
        const treatment = await treatmentModel.findOne({ treatment_id });
        if (!treatment) {
          return res.status(400).json({
            success: false,
            message: "Treatment not found",
          });
        }
    
        if (paid_amount <= 0) {
          return res.status(400).json({
            success: false,
            message: "Paid amount must be greater than 0",
          });
        }
    
        if (treatment.duePayment <= 0) {
          return res.status(400).json({
            success: false,
            message: "No due payment remaining for this treatment",
          });
        }
    
        if (paid_amount > treatment.duePayment) {
          return res.status(400).json({
            success: false,
            message: "Paid amount cannot be greater than due payment",
          });
        }
    
        // Update due payment and add payment record
        treatment.duePayment -= paid_amount;
        treatment.payment_details.push({
          paid_amount,
          paymentMethod,
          payment_Date,
        });
    
        await treatment.save();
    
        //  Send WhatsApp Message to the patient
        const patient = await patientModel.findOne({ patientId: treatment.patientId });
    
        if (patient && patient.emergency_contact_no && patient.phoneCode) {
          const phoneCode = patient.phoneCode.startsWith('+') ? patient.phoneCode : `+${patient.phoneCode}`;
          const fullNumber = `${phoneCode}${String(patient.emergency_contact_no)}`;
    
          const waMessage = `Hello ${patient.patient_name}, we have received your payment of ₹${paid_amount} for treatment "${treatment.treatment_course_name}".\n\n💳 Payment Method: ${paymentMethod}\nDate: ${new Date(payment_Date).toLocaleDateString()}\nRemaining Balance: ₹${treatment.duePayment}\n\nThank you for your payment!`;
    
          try {
            const whatsappResult = await sendWhatsAppMessage(fullNumber, waMessage);
            console.log("WhatsApp Message Sent:", whatsappResult);
          } catch (waErr) {
            console.error("WhatsApp Error:", waErr.message);
          }
        }
    
        return res.status(200).json({
          success: true,
          message: `Payment of ₹${paid_amount} added for treatment ID: ${treatment_id}`,
        });
    
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Server error",
          error_message: error.message,
        });
      }
    };
    
    

                                                      /* All earnings  */
      
  const totalEarnings = async (req, res) => {
  try {
    // Fetch all treatments, sorted by creation date (latest first)
    const treatments = await treatmentModel.find({}).sort({ createdAt: -1 });

    if (!treatments || treatments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No transaction found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'All Earnings',
      earnings: treatments.map((e) => ({
        patientId: e.patientId,
        patient_name: e.patient_name,
        Disease_agreement: e.treatment_course_name,
        total_Amount: e.totalCharge,
        amount_paid: e.totalCharge - e.duePayment,
        remaining_balance: e.duePayment,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error_message: error.message,
    });
  }
};

                  
  /* Chat Section */

            // Api for add user chat 

            const userChat = async (req, res) => {
              try {
                  const userId = req.params.userId;
                  const { message } = req.body;
          
                  // Check for user 
                  if (!userId) {
                      return res.status(400).json({
                          success: false,
                          message: 'User Id Required',
                      });
                  }
          
                  const user = await userModel.findOne({
                      _id: userId,
                  });
                  if (!user) {
                      return res.status(400).json({
                          success: false,
                          message: 'User Not Found',
                      });
                  }
          
                  // Check if file is uploaded 
                  let attachment = '';
                  if (req.file) {
                      attachment = req.file.filename;
                  }
          
                  // Add new message
                  const newMessage = new chatModel({
                      userId,
                      userName: user.name,
                      message,
                      attachment,
                  });
                    
                  await newMessage.save();
          
                  return res.status(200).json({
                      success: true,
                      message: 'Message Submitted Successfully',
                  });
              } catch (error) {
                  return res.status(500).json({
                      success: false,
                      message: 'Server error',
                      error_message: error.message,
                  });
              }
          };
          

          // Api for get all chats
             const get_chats = async( req , res)=> {
                   try {
                           // check for all chats

                           const allChats = await chatModel.find({ })
                           if(!allChats)
                           {
                            return res.status(200).json({
                                 success : false ,
                                 message : 'No chats found'
                            })
                           } 

                           return res.status(200).json({
                               success : true ,
                               message : 'All Chats',
                               chats : allChats.map((c)=> ({
                                      userId : c.userId,
                                      userName : c.userName,
                                      message : c.message,
                                      attachment : c.attachment || ''
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
    
            // Get filtered patient reports
const getFilteredReports = async (req, res) => {
  try {
    const { startDate, endDate, treatment_course_name, country ,age } = req.query;

    // Build filter object dynamically
    let filter = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (treatment_course_name) {
      filter.treatment_course_name = treatment_course_name;
    }

    if (country) {
      filter.country = country;
    }

    if (age) {
      filter.age = age;
    }

    // Fetch patients matching the criteria, selecting only required fields
    const patients = await patientModel.find(filter).lean();

      
    if (!patients.length) {
      return res.status(404).json({ success  : false, message: "No matching records found" });
    }

    res.status(200).json({ success: true, message : "Filtered patients retrieved successfully",data: patients });

  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
   
const get_all_treatment_courses = async (req, res) => {
  try {
    const courses = await treatement_course_model.find({}).sort({ createdAt: -1 }).lean();

    if (!courses.length) {
      return res.status(400).json({
        success: false,
        message: 'No Treatment Course added yet',
      });
    }

    const results = [];

    for (const course of courses) {
      const treatments = await treatmentModel.find({ treatment_course_id: course._id }).lean();
      const patientIds = treatments.map(t => t.patientId);

      let most_demanded_country = '';

      if (patientIds.length > 0) {
        const patients = await patientModel.find(
          { patientId: { $in: patientIds } },
          { country: 1, _id: 0 }
        ).lean();

        const countryCountMap = {};
        for (const p of patients) {
          const country = p.country?.trim();
          if (country) {
            countryCountMap[country] = (countryCountMap[country] || 0) + 1;
          }
        }

        const sortedCountries = Object.entries(countryCountMap).sort((a, b) => b[1] - a[1]);
        if (sortedCountries.length > 0) {
          most_demanded_country = sortedCountries[0][0];
        }
      }

      results.push({
        course_id: course._id,
        course_name: course.course_name,
        course_price: course.course_price,
        most_demanded_country,
        categories: course.categories.map(c => ({
          category_name: c.category_name,
          category_id: c._id
        })),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'All Treatment Courses with Most Demanded Country',
      treatment_courses: results,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error_message: error.message,
    });
  }
};


const allowedFileTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

const addReports = async (req, res) => {
  try {
    const { treatmentId } = req.params;
    const { reportTitle } = req.body;

    // Validate treatment ID
    if (!treatmentId) {
      return res.status(400).json({
        success: false,
        message: "Treatment ID is required",
      });
    }

    // Find treatment record
    const treatmentData = await treatmentModel.findOne({treatment_id:treatmentId});
    if (!treatmentData) {
      return res.status(404).json({
        success: false,
        message: "Treatment not found",
      });
    }

    // Validate report title
    if (!reportTitle || reportTitle.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Report title is required",
      });
    }

    // Validate file presence
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Treatment report file is required",
      });
    }

    // Validate file type
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    if (!allowedFileTypes.includes(fileExt)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, PNG allowed.",
      });
    }
 // Save report
const newReport = await reportModel.create({
  treatmentId: treatmentData.treatment_id, // use the ObjectId from the found treatment
  treatment_course_name: treatmentData.treatment_course_name,
  reportTitle,
  treatmentReport: req.file.filename,
});

return res.status(201).json({
  success: true,
  message: "Report added successfully",
  data: newReport,
});
} catch (error) {
return res.status(500).json({
  success: false,
  message: "Internal Server Error",
  error: error.message,
});
}
};



module.exports = { add_staff_user  ,  login  , get_all_user_staffs , get_details , update_details, delete_user_staff, add_notes,
    change_user_password, staff_forget_pass_otp,staff_verify_otp,staff_reset_password ,active_inactive_staff_user , logout , refreshToken,

  /* Country Section  */
    addCountry, getCountries, editCountry , deleteCountry,changeCountryStatus,getActiveCountries,
    /* Hospital Section */
    add_hospital , getAll_hospital ,getActiveHospitals, update_Hospital_Details ,changeHospitalStatus, delete_hospital ,

    /* Enquiry Section */

    add_new_enq , all_Enq , get_Enq , update_enq , update_Enquiry_status ,  getOldEnquiryHistory, deleteEnquiry ,

    
    /* treatment Course */
    add_treatment_course ,
    //  get_all_treatment_courses ,
     get_treatment_course_by_id, update_treatment_course  , delete_treatment_course ,

    /* Patient Section */
    all_patients , deletePatient, get_notes_by_patient, generate_sampleFile ,
    import_file, get_patient , update_patient , update_patient_status ,  

    /* patient_Kyc_details */
    patient_Kyc_details, 
        
    /* patient_extra_service */
    patient_extra_service ,

    /* service Section */
    add_service , all_services , active_inactive_Service , get_activeServices,paid_service ,update_service, delete_service,
    add_free_service,   
    /* treatment section */

    create_treatment , get_patient_treatment , assign_patient_to_hospital , update_patient_treatment_status , add_new_treatment_payment ,
    update_treatment_status,get_unadded_services_for_treatment,

    /* Appointment Section */
    create_appointment , all_appointment , get_patient_appointment ,update_appointment_status,


    /* Report section */
    exportfilteredpatient  , patientCount_year_wise ,

    /* Dashboard Section */

    Dashboard_count ,

    /* All earnings */
    totalEarnings,

    /* Chat Group */
    userChat  , get_chats,


    getFilteredReports,

    get_all_treatment_courses,

    addReports


}



