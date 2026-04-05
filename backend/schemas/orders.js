const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
    table: { type: mongoose.Types.ObjectId, ref: 'table', required: true },
    customer: { type: mongoose.Types.ObjectId, ref: 'customer' },
    user: { type: mongoose.Types.ObjectId, ref: 'user' },
    status: { type: String, enum: ['pending', 'open', 'waiting_payment', 'closed', 'cancelled'], default: 'open' },
    paymentMethod: { type: String, enum: ['cash', 'transfer', null], default: null },
    discountCode: { type: String, default: null },
    discountAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('order', orderSchema);
