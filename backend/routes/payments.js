const express = require('express');
const router = express.Router();
const invoiceModel = require('../schemas/invoices');
const orderDetailModel = require('../schemas/orderDetails');

// Lịch sử thanh toán = danh sách invoice đã có paymentMethod
router.get('/', async (req, res) => {
    res.send(await invoiceModel.find({ isDeleted: false })
        .populate({ path: 'order', populate: { path: 'table', select: 'number' } })
        .sort({ createdAt: -1 }));
});

router.get('/:id', async (req, res) => {
    try {
        const inv = await invoiceModel.findById(req.params.id)
            .populate({ path: 'order', populate: [{ path: 'table', select: 'number' }, { path: 'customer', select: 'name phone' }] });
        if (!inv) return res.status(404).send({ message: 'Not found' });
        const details = await orderDetailModel.find({ order: inv.order._id }).populate('menuItem', 'name price');
        res.send({ invoice: inv, details });
    } catch { res.status(404).send({ message: 'Not found' }); }
});

module.exports = router;
