const roleModel = require('../schemas/roles');

module.exports = {
    findByName(name) {
        return roleModel.findOne({ name });
    },
    create(payload) {
        return roleModel.create(payload);
    }
};
