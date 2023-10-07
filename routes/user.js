const express = require('express')
const router = express.Router()

//import controller
const { requireLogin, adminMiddleware } = require('../controllers/auth')
const {read, update} = require('../controllers/user')

router.get('/user/:id', requireLogin, read);
router.put('/user/update', requireLogin, update);
router.put('/admin/update', requireLogin, adminMiddleware, update);


module.exports = router;