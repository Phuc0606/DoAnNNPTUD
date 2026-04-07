const mongoose = require('mongoose');
const orderDetailSchema = new mongoose.Schema({
    order: { type: mongoose.Types.ObjectId, ref: 'order', required: true },
    menuItem: { type: mongoose.Types.ObjectId, ref: 'menuItem', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    note: { type: String, default: "" }
}, { timestamps: true });
module.exports = mongoose.model('orderDetail', orderDetailSchema);
