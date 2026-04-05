var express = require("express");
var router = express.Router();
let userController = require('../services/users');
let { RegisterValidator, validationResult, ChangPasswordValidator } = require('../utils/validatorHandler');
let { CheckLogin } = require('../utils/authHandler');
let jwt = require('jsonwebtoken');
let bcrypt = require('bcrypt');
let crypto = require('crypto');
let { sendMail } = require('../utils/mailHandler');
let mongoose = require('mongoose');
let cartSchema = require('../schemas/carts');
let roleModel = require('../schemas/roles');
const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = '1071806914161-9ac8nme27aakdjbueel6vkonn4noi975.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

router.post('/register', RegisterValidator, validationResult, async function (req, res) {
    let session = await mongoose.startSession();
    session.startTransaction();
    try {
        let userRole = await roleModel.findOne({ name: 'user' });
        if (!userRole) userRole = await roleModel.create({ name: 'user' });
        let newItem = await userController.CreateAnUser(
            req.body.username, req.body.password, req.body.email, userRole._id, session
        );
        let newCart = new cartSchema({ user: newItem._id });
        await newCart.save({ session });
        await session.commitTransaction();
        await session.endSession();
        res.send({ message: 'Dang ky thanh cong', user: { username: newItem.username, email: newItem.email } });
    } catch (err) {
        await session.abortTransaction();
        await session.endSession();
        res.status(400).send({ message: err.message });
    }
});

router.post('/login', async function (req, res) {
    try {
        let { username, password } = req.body;
        let result = await userController.FindUserByUsername(username);
        if (!result) return res.status(403).send("sai thong tin dang nhap");
        if (result.lockTime > Date.now()) return res.status(403).send("ban dang bi khoa tai khoan");
        result = await userController.CompareLogin(result, password);
        if (!result) return res.status(403).send("sai thong tin dang nhap");
        await result.populate('role');
        let token = jwt.sign({ id: result._id, role: result.role?.name }, 'secretKey', { expiresIn: '1d' });
        res.cookie("LOGIN_NNPTUD_S3", token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
        res.json({ token, role: result.role?.name });
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

router.get('/me', CheckLogin, function (req, res) {
    res.send(req.user);
});

router.post('/logout', CheckLogin, function (req, res) {
    res.cookie("LOGIN_NNPTUD_S3", "", { maxAge: 0, httpOnly: true });
    res.send("da logout");
});

router.post('/changepassword', CheckLogin, ChangPasswordValidator, validationResult, async function (req, res) {
    let { newpassword, oldpassword } = req.body;
    let user = req.user;
    if (bcrypt.compareSync(oldpassword, user.password)) {
        user.password = newpassword;
        await user.save();
        res.send("doi pass thanh cong");
    } else {
        res.status(404).send("old password khong dung");
    }
});

router.post('/forgotpassword', async function (req, res) {
    let { email } = req.body;
    let user = await userController.FindUserByEmail(email);
    if (user) {
        user.forgotPasswordToken = crypto.randomBytes(32).toString('hex');
        user.forgotPasswordTokenExp = Date.now() + 10 * 60 * 1000;
        let url = "http://localhost:3000/api/v1/auth/resetpassword/" + user.forgotPasswordToken;
        await user.save();
        await sendMail(user.email, url);
    }
    res.send("check email");
});

router.post('/resetpassword/:token', async function (req, res) {
    let { password } = req.body;
    let user = await userController.FindUserByToken(req.params.token);
    if (user) {
        user.password = password;
        user.forgotPasswordToken = null;
        user.forgotPasswordTokenExp = null;
        await user.save();
        res.send("da cap nhat");
    } else {
        res.status(404).send("token loi");
    }
});

// Đăng nhập bằng Google
router.post('/google', async function (req, res) {
    try {
        const { credential } = req.body;
        const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        const { email, name } = payload;
        let user = await userController.FindUserByEmail(email);
        if (!user) {
            let userRole = await roleModel.findOne({ name: 'user' });
            if (!userRole) userRole = await roleModel.create({ name: 'user' });
            const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 1000);
            const randomPassword = crypto.randomBytes(16).toString('hex');
            user = await userController.CreateAnUser(username, randomPassword, email, userRole._id, null, name);
        }
        await user.populate('role');
        const token = jwt.sign({ id: user._id, role: user.role?.name }, 'secretKey', { expiresIn: '1d' });
        res.json({ token, role: user.role?.name });
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;
