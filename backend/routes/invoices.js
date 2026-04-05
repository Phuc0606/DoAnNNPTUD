const express = require('express');
const router = express.Router();
const invoiceModel = require('../schemas/invoices');
const orderDetailModel = require('../schemas/orderDetails');
const orderModel = require('../schemas/orders');
const tableModel = require('../schemas/tables');
const { applyDiscount } = require('../utils/discountHelper');

router.get('/', async (req, res) => {
    res.send(await invoiceModel.find({ isDeleted: false })
        .populate({ path: 'order', populate: { path: 'table', select: 'number' } })
        .sort({ createdAt: -1 }));
});

router.get('/:id', async (req, res) => {
    try {
        const item = await invoiceModel.findOne({ _id: req.params.id, isDeleted: false })
            .populate({ path: 'order', populate: [{ path: 'table', select: 'number' }, { path: 'customer', select: 'name phone' }] });
        if (!item) return res.status(404).send({ message: 'Not found' });

        const details = await orderDetailModel.find({ order: item.order._id })
            .populate('menuItem', 'name price');
        res.send({ invoice: item, details });
    } catch { res.status(404).send({ message: 'Not found' }); }
});

// Xem trước hóa đơn (chưa lưu) - dùng để hiển thị tạm tính
// Body: { orderId, discountCode? }
router.post('/preview', async (req, res) => {
    try {
        const { orderId, discountCode } = req.body;
        if (!orderId) return res.status(400).send({ message: 'Thiếu orderId' });

        const details = await orderDetailModel.find({ order: orderId }).populate('menuItem', 'name price');
        if (details.length === 0) return res.status(400).send({ message: 'Đơn hàng không có món nào' });

        const totalAmount = details.reduce((sum, d) => sum + d.price * d.quantity, 0);

        let discountAmount = 0;
        let discountInfo = null;
        if (discountCode) {
            const result = await applyDiscount(discountCode, totalAmount);
            discountAmount = result.discountAmount;
            discountInfo = result.discountInfo;
        }

        const finalAmount = Math.max(0, totalAmount - discountAmount);

        res.send({ totalAmount, discountAmount, finalAmount, discountInfo, details });
    } catch (err) { res.status(400).send({ message: err.message }); }
});

// Xuất hóa đơn + xác nhận thanh toán (1 bước)
// Body: { orderId, discountCode?, discountAmount?, paymentMethod }
router.post('/', async (req, res) => {
    try {
        const { orderId, discountCode, paymentMethod } = req.body;
        let { discountAmount = 0 } = req.body;

        if (!orderId || !paymentMethod) return res.status(400).send({ message: 'Thiếu orderId hoặc phương thức thanh toán' });

        // Kiểm tra đơn đã có hóa đơn chưa
        const existing = await invoiceModel.findOne({ order: orderId, isDeleted: false });
        if (existing) return res.status(400).send({ message: 'Đơn hàng này đã được xuất hóa đơn' });

        const details = await orderDetailModel.find({ order: orderId });
        if (details.length === 0) return res.status(400).send({ message: 'Đơn hàng không có món nào' });

        const totalAmount = details.reduce((sum, d) => sum + d.price * d.quantity, 0);

        // Nếu có mã giảm giá thì tính lại
        if (discountCode) {
            try {
                const result = await applyDiscount(discountCode, totalAmount);
                discountAmount = result.discountAmount;
            } catch (err) {
                return res.status(err.status || 400).send({ message: err.message });
            }
        }

        const finalAmount = Math.max(0, totalAmount - discountAmount);

        // Tạo invoice
        const invoice = new invoiceModel({
            order: orderId,
            totalAmount,
            discount: discountAmount,
            finalAmount,
            discountCode: discountCode ? discountCode.toUpperCase() : undefined,
            paymentMethod
        });
        await invoice.save();

        // Cập nhật order → closed, bàn → available
        const order = await orderModel.findByIdAndUpdate(orderId, { status: 'closed' }, { new: true });
        await tableModel.findByIdAndUpdate(order.table, { status: 'available' });

        res.send(invoice);
    } catch (err) { res.status(400).send({ message: err.message }); }
});

module.exports = router;
