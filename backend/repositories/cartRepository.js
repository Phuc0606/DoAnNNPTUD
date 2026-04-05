const cartModel = require('../schemas/carts');

module.exports = {
    create(payload, session) {
        const cart = new cartModel(payload);
        return cart.save({ session });
    }
};
