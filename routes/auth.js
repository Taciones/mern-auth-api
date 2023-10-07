const express = require('express')
const router = express.Router()

//import controller
const {register, accountActivation, login, resetPassword, forgotPassword} = require('../controllers/auth')

// import validators
const {userSignupValidator, userSigninValidator, 
        forgotPasswordValidator, resetPasswordValidator} = require('../validators/auth')
const {runValidation} = require('../validators')

//router.get('/signup', signup);
router.post('/register', userSignupValidator, runValidation, register);
router.post('/account-activation', accountActivation);
router.post('/login', userSigninValidator, runValidation, login);
// forgot reset password routes
router.put('/forgot-password', forgotPasswordValidator, runValidation, forgotPassword)
router.put('/reset-password', resetPasswordValidator, runValidation, resetPassword)


module.exports = router;