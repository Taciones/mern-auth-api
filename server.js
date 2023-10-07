const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv').config();

const app = express()
//app.use(cors()); // allows all origins
if(process.env.NODE_ENV === 'development') {
    console.log(`App running on env: ${process.env.NODE_ENV}`)
    app.use(cors({
        origin: `http://localhost:3000`,
        methods: ['GET', 'POST', 'PUT']    
    }));
}

//app.use(cors());

// const corsOptions ={
//     origin:'*', 
//     credentials:true,            //access-control-allow-credentials:true
//     optionSuccessStatus:200,
//  }

// connects to DB

mongoose.connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('DB connected'))
.catch(err => console.log('DB CONNECTION ERROR: ', err));

//import ROUTES
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')

// app middlewares
app.use(morgan('dev'));
app.use(bodyParser.json());

// midleware
app.use('/api', authRoutes);
app.use('/api', userRoutes);



const port = process.env.PORT || 8001;
app.listen(port, () => {
    console.log(`API is running on port ${port}`);
});