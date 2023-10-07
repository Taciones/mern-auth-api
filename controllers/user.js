const User = require("../models/user");

exports.read = (req, res) => {
  const userId = req.params.id;

  User.findById(userId)
    .exec()
    .then((user) => {
      if (!user) {
        return res.status(400).json({
          error: "User not found",
        });
      }

      res.json(user);
    })
    .catch((err) => {
      return res.status(400).json({
        error: "User not found",
      });
    });
};

exports.update = (req, res) => {
    console.log('UPDATE USER - req.user', req.user, 'UPDATE DATA', req.body);
    
    const {name, password} = req.body

    User.findOne({ _id: req.user })
        .then(user => {
            if (!user) {
            return res.status(400).json({
                error: 'User not found.'
            });
            }

            if (!name) {
            return res.status(400).json({
                error: 'Name is required.'
            });
            } else {
            user.name = name;
            }

            if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                error: 'Password should be 6 characters long.'
                });
            } else {
                user.password = password;
            }
            }

            return user.save();
        })
        .then(updateUser => {
            // Create a sanitized version of the user object
            const sanitizedUser = {
            _id: updateUser._id,
            username: updateUser.username,
            // Include other properties you want to send
            };

            // Send the response here, once the update is successful
            res.json({
                message: 'Required fields were updated successfully.',
                user: sanitizedUser,
              });
        })
        .catch(err => {
            console.log('USER UPDATE ERROR', err);
            if (!res.headersSent) {
            // Check if headers have been sent already
            res.status(400).json({
                error: 'User update failed.'
            });
        }
  });

};
