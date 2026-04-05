const userModel = require('../schemas/users');

module.exports = {
    create(payload, session) {
        const user = new userModel(payload);
        return user.save({ session });
    },
    findActiveByUsername(username) {
        return userModel.findOne({ isDeleted: false, username });
    },
    findActiveByEmail(email) {
        return userModel.findOne({ isDeleted: false, email });
    },
    findActiveById(id) {
        return userModel.findOne({ _id: id, isDeleted: false }).populate('role');
    },
    findActiveByToken(token) {
        return userModel.findOne({ isDeleted: false, forgotPasswordToken: token });
    },
    findAllActive() {
        return userModel.find({ isDeleted: false }).populate({ path: 'role', select: 'name' });
    },
    findActiveDetailById(id) {
        return userModel.findOne({ _id: id, isDeleted: false }).populate('role');
    },
    updateById(id, payload) {
        return userModel.findByIdAndUpdate(id, payload, { new: true });
    },
    updateRole(id, roleId) {
        return userModel.findByIdAndUpdate(id, { role: roleId }, { new: true }).populate('role');
    },
    softDelete(id) {
        return userModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    }
};
