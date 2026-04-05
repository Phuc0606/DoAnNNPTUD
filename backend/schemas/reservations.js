const mongoose = require('mongoose');
const reservationSchema = new mongoose.Schema({
    // Thông tin khách (lưu trực tiếp, không bắt buộc phải có customer account)
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    customer: { type: mongoose.Types.ObjectId, ref: 'customer', default: null },

    // Bàn được gán (chỉ có sau khi nhân viên confirm)
    table: { type: mongoose.Types.ObjectId, ref: 'table', default: null },

    reservationDate: { type: Date, required: true }, // ngày + giờ gộp lại
    guestCount: { type: Number, default: 1, min: 1 },
    note: { type: String, default: '' },

    status: {
        type: String,
        enum: ['pending', 'confirmed', 'checked_in', 'cancelled', 'no_show'],
        default: 'pending'
    },
    checkedInAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('reservation', reservationSchema);
