const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');

module.exports = {
    CreateAnUser: async function (username, password, email, role, session,
        fullName, avatarUrl, status, loginCount
    ) {
        return userRepository.create({
            username, password, email, fullName,
            avatarUrl, status, role, loginCount
        }, session);
    },
    FindUserByUsername: async function (username) {
        return await userRepository.findActiveByUsername(username);
    },
    FindUserByEmail: async function (email) {
        return await userRepository.findActiveByEmail(email);
    },
    FindUserByToken: async function (token) {
        let result = await userRepository.findActiveByToken(token);
        if (result && result.forgotPasswordTokenExp > Date.now()) return result;
        return false;
    },
    CompareLogin: async function (user, password) {
        if (bcrypt.compareSync(password, user.password)) {
            user.loginCount = 0;
            await user.save();
            return user;
        }
        user.loginCount++;
        if (user.loginCount == 3) {
            user.lockTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
            user.loginCount = 0;
        }
        await user.save();
        return false;
    },
    GetUserById: async function (id) {
        try {
            return await userRepository.findActiveById(id);
        } catch (error) {
            return false;
        }
    }
};
