const jwt = require('jsonwebtoken');
const userService = require('../services/users');
const { jwtSecret } = require('../services/auth');

module.exports = {
    CheckLogin: async function (req, res, next) {
        let key = req.headers.authorization;
        if (key && key.startsWith('Bearer ')) {
            key = key.split(' ')[1];
        } else if (!key) {
            key = req.cookies.LOGIN_NNPTUD_S3;
        }

        if (!key) {
            res.status(404).send("ban chua dang nhap");
            return;
        }

        try {
            const result = jwt.verify(key, jwtSecret);
            if (result.exp * 1000 < Date.now()) {
                res.status(404).send("ban chua dang nhap");
                return;
            }

            const user = await userService.GetUserById(result.id);
            if (!user) {
                res.status(404).send("ban chua dang nhap");
                return;
            }

            req.user = user;
            next();
        } catch (error) {
            res.status(404).send("ban chua dang nhap");
        }
    },
    CheckRole: function (requiredRoles) {
        return function (req, res, next) {
            const currentRole = req.user.role?.name;
            if (requiredRoles.includes(currentRole)) {
                next();
                return;
            }

            res.status(403).send("ban khong co quyen");
        };
    }
};
