const express = require('express');
const router = express.Router();
const user = require("../controllers/user");
const {isLoggedIn,isNotLoggedIn,isOwner,isAdmin,isAdManager}=require("../middleware/auth");

//=================================
//             User
//=================================

// ____________ common ____________

/* local & google login */
router.post('/login/local',isNotLoggedIn,user.loginLocal);
router.post("/login/google",isNotLoggedIn,user.loginGoogle);

/* connect to social account */
router.post('/google',isLoggedIn,user.connectGoogle);
router.delete('/google',isLoggedIn,user.disconnectGoogle);

/* logout */
router.get("/logout", isLoggedIn,user.logout);

// read & update oneself
router.get('/',isLoggedIn,user.read);
router.put('/:field',isLoggedIn,user.updateField);

// ____________ owner ____________
router.post('/owners',isOwner,user.validateOwner,user.createOwner);
router.get('/owners/list',isOwner, user.readOwners);
router.get('/admins',isOwner, user.readAdmin);

// ____________ admin ____________
// admin appoints member as manager
router.post('/managers/:_id',isAdmin,user.appointManager);
router.delete('/managers/:_id',isAdmin,user.cancelManager);

// ____________ admin + manager ____________
router.post('/members',isAdManager,user.validateMembers,user.createMembers);
router.get('/members/list',isAdManager,user.readMembers);
router.put('/members/:_id/:field',isAdManager,user.validateUpdate,user.updateMemberField);
router.delete('/members/:_id',isAdManager,user.deleteMember);

module.exports = router;