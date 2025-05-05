const express = require('express');
require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');
const userRouter = require('./src/routes/userRouter')
const permission_Router = require('./src/routes/permission_Router')
const permissionDashboard_Router = require('./src/routes/permission_dashboard_Router')
const path  = require("path")
const app = express();
const port = process.env.PORT || 5200;

// Database configuration
const db = require('./src/config/db')

// Middleware configuration
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('uploads'))
app.use('/omca_crm/api/omca_crm/exports', express.static(path.join(__dirname, 'exports')));

// Routes
app.get('/', (req, res) => {
    res.send('Welcome to OMCA Family');
});




app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); 
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    next();
    });

// Router configuration
      app.use('/api', userRouter)
      app.use('/api' , permission_Router)
      app.use('/api' , permissionDashboard_Router)

// Start the server
app.listen(port, () => {
    console.log(`Server is running on PORT: ${port}`);
});
