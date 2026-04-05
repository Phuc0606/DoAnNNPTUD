const express = require('express');
const router = express.Router();
const discountModel = require('../schemas/discounts');
const { applyDiscount } = require('../utils/discountHelper');

// Lấy tất cả mã giảm giá
router.get('/', async (req, res) => {
    res.send(await discountModel.find().sort({ createdAt: -1 }));
});

// Tạo mã giảm giá
router.post('/', async (req, res) => {
    try {
        const discount = new discountModel(req.body);
        await discount.save();
        res.send(discount);
    } catch (err) { res.status(400).send({ message: err.message }); }
});

// Kiểm tra & áp dụng mã giảm giá — Body: { code, totalAmount }
router.post('/check', async (req, res) => {
    try {
        const { code, totalAmount } = req.body;
        if (!code || !totalAmount) return res.status(400).send({ message: 'Thiếu thông tin' });

        const { discountAmount, discountInfo } = await applyDiscount(code, totalAmount);
        res.send({ valid: true, ...discountInfo, discountAmount, finalAmount: Math.max(0, totalAmount - discountAmount) });
    } catch (err) {
        res.status(err.status || 400).send({ message: err.message });
    }
});

// Cập nhật mã giảm giá
router.put('/:id', async (req, res) => {
    try {
        const discount = await discountModel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!discount) return res.status(404).send({ message: 'Not found' });
        res.send(discount);
    } catch (err) { res.status(400).send({ message: err.message }); }
});

// Bật/tắt trạng thái mã
router.patch('/:id/toggle', async (req, res) => {
    try {
        const discount = await discountModel.findById(req.params.id);
        if (!discount) return res.status(404).send({ message: 'Not found' });
        discount.isActive = !discount.isActive;
        await discount.save();
        res.send(discount);
    } catch (err) { res.status(400).send({ message: err.message }); }
});

// Xoá mã
router.delete('/:id', async (req, res) => {
    try {
        await discountModel.findByIdAndDelete(req.params.id);
        res.send({ message: 'Đã xoá' });
    } catch (err) { res.status(400).send({ message: err.message }); }
});

module.exports = router;
