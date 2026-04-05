var express = require("express");
var router = express.Router();
let { CreateUserValidator, validationResult } = require('../utils/validatorHandler');
let userModel = require("../schemas/users");
let roleModel = require('../schemas/roles');
let userController = require('../services/users');
let { CheckLogin, CheckRole } = require('../utils/authHandler');

// GET ALL users - chỉ admin
router.get("/", CheckLogin, CheckRole(['admin']), async function (req, res) {
  let users = await userModel.find({ isDeleted: false }).populate({ path: 'role', select: 'name' });
  res.send(users);
});

router.get("/:id", CheckLogin, CheckRole(['admin']), async function (req, res) {
  try {
    let result = await userModel.findOne({ _id: req.params.id, isDeleted: false }).populate('role');
    if (result) res.send(result);
    else res.status(404).send({ message: "id not found" });
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});

router.post("/", CreateUserValidator, validationResult, async function (req, res) {
  try {
    let newItem = await userController.CreateAnUser(
      req.body.username, req.body.password, req.body.email, req.body.role
    );
    res.send(newItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// Đổi role user - chỉ admin
router.put("/:id/role", CheckLogin, CheckRole(['admin']), async function (req, res) {
  try {
    const { roleName } = req.body;
    const role = await roleModel.findOne({ name: roleName });
    if (!role) return res.status(404).send({ message: "Role not found" });
    const user = await userModel.findByIdAndUpdate(
      req.params.id, { role: role._id }, { new: true }
    ).populate('role');
    if (!user) return res.status(404).send({ message: "User not found" });
    res.send(user);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.put("/:id", CheckLogin, CheckRole(['admin']), async function (req, res) {
  try {
    let updatedItem = await userModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedItem) return res.status(404).send({ message: "id not found" });
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.delete("/:id", CheckLogin, CheckRole(['admin']), async function (req, res) {
  try {
    let updatedItem = await userModel.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!updatedItem) return res.status(404).send({ message: "id not found" });
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
