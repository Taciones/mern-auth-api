const User = require('../models/user');
const jwt = require('jsonwebtoken')
const expressJwt = require('express-jwt');
//sendgrid
const sgMail = require('@sendgrid/mail');
const user = require('../models/user');
const _ = require('lodash')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// exports.signup = (req, res) => {
//     console.log('RED BODY ON SIGNUP', req.body);
//     const { name, email, password } = req.body;

//     User.findOne({ email })
//         .then((user) => {
//             if (user) {
//                 return res.status(400).json({
//                     error: 'Email is taken'
//                 });
//             }

//             // Create a new user
//             const newUser = new User({ name, email, password });

//             // Save the new user to the database
//             newUser.save()
//                 .then(() => {
//                     res.json({
//                         message: 'Signup success! Please signin.'
//                     });
//                 })
//                 .catch((err) => {
//                     console.log('SIGNUP ERROR', err);
//                     return res.status(400).json({
//                         error: err.message // You can use err.message to provide more informative error messages
//                     });
//                 });
//         })
//         .catch((err) => {
//             console.log('FIND USER ERROR', err);
//             return res.status(500).json({
//                 error: err.message
//             });
//         });
// };


exports.register = (req, res) => {
    const {name,email,password} = req.body

        User.findOne({ email })
            .then((user) => {
                if (user) {
                    return res.status(400).json({
                        error: 'Email is taken'
                    });
                }
        const token = jwt.sign({name, email, password}, process.env.JWT_ACCOUNT_ACTIVATION, {expiresIn: '10m'})

        const emailData = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `Account activation link`,
            html: `
                <p> Please use the following link to activate your account</p>
                <p>${process.env.CLIENT_URL}/auth/activate/${token}</p>
                <p>This email may contain sensetive information</p>
                <p>${process.env.CLIENT_URL}</p>
            `
        }

        sgMail.send(emailData).then(sent => {
            //console.log('SIGNUP EMAIL SENT', sent)
            return res.json({
                message: `Email has been to sent to ${email}. Follow the instructions to signup your account.`
            })
        })
        .catch(err => {
            //console.log('SIGNUP EMAIL SENT ERROR', sent)
            return res.json({
                message: err.message
            })

        })      
    });

};

exports.accountActivation = (req, res) => {
    const {token} = req.body
    
    if(token) {
        jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, function(err, decoded) {
            if(err) {
                console.log('JWT VERIFY IN ACCOUNT ACTIVATION ERROR')
                return res.status(401).json({
                    error: 'Expired or wrong link. Signup again.'
                })
            }
            const {name, email, password} = jwt.decode(token)
            const user = new User({name, email, password})

            // Save the user without a callback, using a Promise instead
            user.save()
                .then(() => {
                    return res.json({
                        message: 'Signup success. Please signin.'
                    });
                })
                .catch((saveErr) => {
                    console.log('SAVE USER IN ACCOUNT ACTIVATION ERROR', saveErr);
                    return res.status(401).json({
                        error: 'Error saving user in database. Try signup again'
                    });
                });
        })
            

            
    } else {
        return res.json({
            message: 'Something went wrong. Try again!'
        })
    };
};


exports.login = (req, res) => {
    const { email, password } = req.body;

    User.findOne({ email })
        .then(user => {
            // Find the user
            if (!user) {
                return res.status(400).json({
                    error: "User with that email does not exist. Please signup!"
                });
            }
            // Authenticate user
            if (!user.authenticate(password)) {
                return res.status(400).json({
                    error: "Email and password do not match."
                });
            }
            
            // Generate token and send to client
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
            const { _id, name, email, role } = user;

            return res.json({
                token,
                user: { _id, name, email, role }
            });
        })
        .catch(err => {
            console.log('LOGIN ERROR', err);
            return res.status(500).json({
                error: 'Internal server error'
            });
        });
};


// Middleware to verify JWT token
exports.requireLogin = (req, res, next) => {
    const token = req.header('x-auth-token');
  
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded Token:', decoded);
      req.user = decoded._id; // Set the user in the request object
      console.log('req.user:', req.user);
      next(); // Move on to the next middleware or route handler
    } catch (err) {
      res.status(401).json({ msg: 'Token is not valid' });
    }
};


exports.adminMiddleware = (req, res, next) => {
    User.findById(req.user)
      .then((user) => {
        if (!user) {
          return res.status(404).json({
            error: 'User not found.'
          });
        }
  
        if (user.role !== 'admin') {
          return res.status(401).json({
            error: 'Admin resource. Access denied.'
          });
        }
  
        // If the user is an admin, proceed to the next middleware or route handler
        next();
      })
      .catch((err) => {
        console.error('Admin Middleware Error:', err);
            return res.status(500).json({
            error: 'Internal server error.'
            });
      });
  };


  exports.forgotPassword = (req, res) => {
    const { email } = req.body;

    User.findOne({ email })
        .then(user => {
            if (!user) {
                return res.status(400).json({
                    error: 'User with that email does not exist.'
                });
            }

            const token = jwt.sign({ _id: user._id, name: user.name }, process.env.JWT_RESET_PASSWORD, { expiresIn: '10m' });

            const emailData = {
                from: process.env.EMAIL_FROM,
                to: email,
                subject: `Password reset link`,
                html: `
                    <p> Please use the following link to reset your password</p>
                    <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
                    <p>This email may contain sensitive information</p>
                    <p>${process.env.CLIENT_URL}</p>
                `
            };

            return user.updateOne({ resetPasswordLink: token })
                .then(() => {
                    return sgMail.send(emailData);
                })
                .then(() => {
                    res.json({
                        message: `Email has been sent to ${email}. Follow the instructions to reset the password.`
                    });
                })
                .catch(err => {
                    console.log('SIGNUP EMAIL SENT ERROR', err);
                    res.status(500).json({
                        error: err.message
                    });
                });
        })
        .catch(err => {
            console.error('FORGOT PASSWORD ERROR', err);
            res.status(500).json({
                error: 'Something went wrong. Please try again later.'
            });
        });
};




exports.resetPassword = (req, res) => {
    const {resetPasswordLink, newPassword} = req.body;

    if(resetPasswordLink) {
        jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, function(err, decoded) {
            if(err) {
                return res.status(400).json({
                    error: 'Expired link. Try again'
                  });
            }

            User.findOne({ resetPasswordLink })
                .then(user => {
                    if (!user) {
                        return res.status(400).json({
                            error: 'Something went wrong, try again.'
                        });
                    }

                    const updaFields = {
                        password: newPassword,
                        resetPasswordLink: ''
                    };

                    user = _.extend(user, updaFields);

                    return user.save()
                        .then(result => {
                            res.json({
                                message: 'Great! Now you can login with your new password.'
                            });
                        })
                        .catch(err => {
                            return res.status(400).json({
                                error: `Error resetting the user's password.`
                            });
                        });
                })
                .catch(err => {
                    console.error('RESET PASSWORD ERROR', err);
                    res.status(500).json({
                        error: 'Something went wrong. Please try again later.'
                    });
                });

            })
        };
}
  