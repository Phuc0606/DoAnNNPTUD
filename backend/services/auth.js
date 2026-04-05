const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const userService = require('./users');
const roleRepository = require('../repositories/roleRepository');
const cartRepository = require('../repositories/cartRepository');
const { sendMail } = require('../utils/mailHandler');

const GOOGLE_CLIENT_ID = '1071806914161-9ac8nme27aakdjbueel6vkonn4noi975.apps.googleusercontent.com';
const JWT_SECRET = 'secretKey';

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function buildTokenPayload(user) {
    return { id: user._id, role: user.role?.name };
}

module.exports = {
    async register(payload) {
        try {
            let userRole = await roleRepository.findByName('user');
            if (!userRole) {
                userRole = await roleRepository.create({ name: 'user' });
            }

            const user = await userService.CreateAnUser(
                payload.username,
                payload.password,
                payload.email,
                userRole._id
            );

            await cartRepository.create({ user: user._id });

            return {
                message: 'Dang ky thanh cong',
                user: {
                    username: user.username,
                    email: user.email
                }
            };
        } catch (error) {
            throw error;
        }
    },
    async login(username, password) {
        let user = await userService.FindUserByUsername(username);
        if (!user) {
            throw new Error('sai thong tin dang nhap');
        }
        if (user.lockTime > Date.now()) {
            throw new Error('ban dang bi khoa tai khoan');
        }

        user = await userService.CompareLogin(user, password);
        if (!user) {
            throw new Error('sai thong tin dang nhap');
        }

        await user.populate('role');
        const token = jwt.sign(buildTokenPayload(user), JWT_SECRET, { expiresIn: '1d' });

        return {
            token,
            role: user.role?.name
        };
    },
    async changePassword(user, oldPassword, newPassword) {
        if (!bcrypt.compareSync(oldPassword, user.password)) {
            throw new Error('old password khong dung');
        }

        user.password = newPassword;
        await user.save();
    },
    async forgotPassword(email) {
        const user = await userService.FindUserByEmail(email);
        if (!user) {
            return;
        }

        user.forgotPasswordToken = crypto.randomBytes(32).toString('hex');
        user.forgotPasswordTokenExp = Date.now() + 10 * 60 * 1000;
        const url = 'http://localhost:3000/api/v1/auth/resetpassword/' + user.forgotPasswordToken;
        await user.save();
        await sendMail(user.email, url);
    },
    async resetPassword(token, password) {
        const user = await userService.FindUserByToken(token);
        if (!user) {
            throw new Error('token loi');
        }

        user.password = password;
        user.forgotPasswordToken = null;
        user.forgotPasswordTokenExp = null;
        await user.save();
    },
    async loginWithGoogle(credential) {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { email, name } = payload;

        let user = await userService.FindUserByEmail(email);
        if (!user) {
            let userRole = await roleRepository.findByName('user');
            if (!userRole) {
                userRole = await roleRepository.create({ name: 'user' });
            }

            const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 1000);
            const randomPassword = crypto.randomBytes(16).toString('hex');
            user = await userService.CreateAnUser(username, randomPassword, email, userRole._id, null, name);
        }

        await user.populate('role');
        const token = jwt.sign(buildTokenPayload(user), JWT_SECRET, { expiresIn: '1d' });
        return {
            token,
            role: user.role?.name
        };
    },
    jwtSecret: JWT_SECRET
};
