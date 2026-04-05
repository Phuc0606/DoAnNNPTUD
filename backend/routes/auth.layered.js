var express = require("express");
var router = express.Router();

let { RegisterValidator, validationResult, ChangPasswordValidator } = require('../utils/validatorHandler');
let { CheckLogin } = require('../middlewares/auth');
const authService = require('../services/auth');

router.post('/register', RegisterValidator, validationResult, async function (req, res) {
    try {
        const result = await authService.register(req.body);
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

router.post('/login', async function (req, res) {
    try {
        const { username, password } = req.body;
        const result = await authService.login(username, password);
        res.cookie("LOGIN_NNPTUD_S3", result.token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
        res.json(result);
    } catch (err) {
        const status = err.message === 'sai thong tin dang nhap' || err.message === 'ban dang bi khoa tai khoan' ? 403 : 400;
        res.status(status).send({ message: err.message });
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
    try {
        let { newpassword, oldpassword } = req.body;
        await authService.changePassword(req.user, oldpassword, newpassword);
        res.send("doi pass thanh cong");
    } catch (err) {
        res.status(404).send(err.message);
    }
});

router.post('/forgotpassword', async function (req, res) {
    let { email } = req.body;
    await authService.forgotPassword(email);
    res.send("check email");
});

router.post('/resetpassword/:token', async function (req, res) {
    try {
        let { password } = req.body;
        await authService.resetPassword(req.params.token, password);
        res.send("da cap nhat");
    } catch (err) {
        res.status(404).send(err.message);
    }
});

router.post('/google', async function (req, res) {
    try {
        const result = await authService.loginWithGoogle(req.body.credential);
        res.json(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;
