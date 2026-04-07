const mongoose = require('mongoose');
const paymentSchema = new mongoose.Schema({
    invoice: { type: mongoose.Types.ObjectId, ref: 'invoice', required: true },
    method: { type: String, enum: ['cash', 'transfer'], required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' }
}, { timestamps: true });
module.exports = mongoose.model('payment', paymentSchema);
