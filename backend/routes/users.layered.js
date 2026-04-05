var express = require("express");
var router = express.Router();

let { CreateUserValidator, validationResult } = require('../utils/validatorHandler');
const userRepository = require('../repositories/userRepository');
const roleRepository = require('../repositories/roleRepository');
let userService = require('../services/users');
let { CheckLogin, CheckRole } = require('../middlewares/auth');

router.get("/", CheckLogin, CheckRole(['admin']), async function (req, res) {
    let users = await userRepository.findAllActive();
    res.send(users);
});

router.get("/:id", CheckLogin, CheckRole(['admin']), async function (req, res) {
    try {
        let result = await userRepository.findActiveDetailById(req.params.id);
        if (result) {
            res.send(result);
            return;
        }

        res.status(404).send({ message: "id not found" });
    } catch (error) {
        res.status(404).send({ message: "id not found" });
    }
});

router.post("/", CreateUserValidator, validationResult, async function (req, res) {
    try {
        let newItem = await userService.CreateAnUser(
            req.body.username,
            req.body.password,
            req.body.email,
            req.body.role
        );
        res.send(newItem);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

router.put("/:id/role", CheckLogin, CheckRole(['admin']), async function (req, res) {
    try {
        const role = await roleRepository.findByName(req.body.roleName);
        if (!role) {
            return res.status(404).send({ message: "Role not found" });
        }

        const user = await userRepository.updateRole(req.params.id, role._id);
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        res.send(user);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

router.put("/:id", CheckLogin, CheckRole(['admin']), async function (req, res) {
    try {
        const updatedItem = await userRepository.updateById(req.params.id, req.body);
        if (!updatedItem) {
            return res.status(404).send({ message: "id not found" });
        }

        res.send(updatedItem);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

router.delete("/:id", CheckLogin, CheckRole(['admin']), async function (req, res) {
    try {
        const updatedItem = await userRepository.softDelete(req.params.id);
        if (!updatedItem) {
            return res.status(404).send({ message: "id not found" });
        }

        res.send(updatedItem);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;
