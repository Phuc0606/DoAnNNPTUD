const userService = require('../services/users');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../services/auth');
module.exports = {
    CheckLogin: async function (req, res, next) {
        let key = req.headers.authorization;
        if (!key) {
            if (req.cookies.LOGIN_NNPTUD_S3) {
                key = req.cookies.LOGIN_NNPTUD_S3;
            } else {
                res.status(404).send("ban chua dang nhap")
                return;
            }

        }

        try {

            let result = jwt.verify(key, jwtSecret)
            if (result.exp * 1000 < Date.now()) {
                res.status(404).send("ban chua dang nhap")
                return;
            }
            let user = await userService.GetUserById(result.id);
            if (!user) {
                res.status(404).send("ban chua dang nhap")
                return;
            }
            req.user = user;
            next();
        } catch (error) {
            res.status(404).send("ban chua dang nhap")
            return;
        }

    },
    CheckRole: function (requiredRoles) {
        return function (req, res, next) {
            let user = req.user;
            let currentRole = user.role?.name;
            if (requiredRoles.includes(currentRole)) {
                next();
            } else {
                res.status(403).send("ban khong co quyen");
            }
        }
    }
}
