const mongoose = require('mongoose');
const invoiceSchema = new mongoose.Schema({
    order: { type: mongoose.Types.ObjectId, ref: 'order', required: true, unique: true },
    totalAmount: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0 },
    discountCode: { type: String, default: null },
    finalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['cash', 'transfer'], required: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('invoice', invoiceSchema);
