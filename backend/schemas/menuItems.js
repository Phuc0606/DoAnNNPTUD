const mongoose = require('mongoose');
const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: mongoose.Types.ObjectId, ref: 'category', required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    stock: { type: Number, default: 0, min: 0 },
    isAvailable: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('menuItem', menuItemSchema);
