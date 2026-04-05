const mongoose = require('mongoose');
const tableSchema = new mongoose.Schema({
    number: { type: Number, required: true, unique: true },
    capacity: { type: Number, default: 4 },
    status: { type: String, enum: ['available', 'occupied'], default: 'available' },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('table', tableSchema);
