const {check} = require('express-validator')

exports.userSignupValidator = [
check('name')
    .not()
    .isEmpty()
    .withMessage('Name is Required'),
check('email')
    .isEmail()
    .withMessage('Must be a valid email adress'),
check('password')
    .isLength({min: 6})
    .withMessage('Password must be 6 characteres long'),
];

exports.userSigninValidator = [
    check('email')
        .isEmail()
        .withMessage('Must be a valid email adress'),
    check('password')
        .isLength({min: 6})
        .withMessage('Password must be 6 characteres long'),
];

exports.forgotPasswordValidator = [
    check('email')
        .not()
        .isEmpty()
        .isEmail()
        .withMessage('Must be a valida email address.'),
];

exports.resetPasswordValidator = [
    check('newPassword')
        .not()
        .isEmpty()
        .isLength({min: 6 })
        .withMessage('Password must be 6 characters  long'),
];