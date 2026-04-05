const express = require('express');
const router = express.Router();
const orderModel = require('../schemas/orders');
const orderDetailModel = require('../schemas/orderDetails');
const tableModel = require('../schemas/tables');
const menuItemModel = require('../schemas/menuItems');
const jwt = require('jsonwebtoken');

// Lấy danh sách đơn đang chờ thanh toán (cho notification dashboard)
router.get('/waiting-payment', async (req, res) => {
    res.send(await orderModel.find({ status: 'waiting_payment', isDeleted: false })
        .populate('table', 'number')
        .sort({ updatedAt: -1 }));
});

// Get all orders
router.get('/', async (req, res) => {
    res.send(await orderModel.find({ isDeleted: false })
        .populate('table', 'number')
        .populate('customer', 'name phone')
        .populate('user', 'username')
        .sort({ createdAt: -1 }));
});

// Get order by ID kèm chi tiết
router.get('/:id', async (req, res) => {
    try {
        const order = await orderModel.findOne({ _id: req.params.id })
            .populate('table', 'number')
            .populate('customer', 'name phone')
            .populate('user', 'username');
        if (!order) return res.status(404).send({ message: 'Not found' });
        const details = await orderDetailModel.find({ order: order._id })
            .populate('menuItem', 'name price');
        res.send({ order, details });
    } catch { res.status(404).send({ message: 'Not found' }); }
});

// Tạo order từ khách hàng (place order) - có kiểm tra stock
router.post('/place', async (req, res) => {
    try {
        const { tableId, items } = req.body;
        if (!tableId || !items || items.length === 0) {
            return res.status(400).send({ message: 'Thiếu thông tin bàn hoặc món' });
        }

        // Lấy userId từ token nếu có
        let userId = null;
        const authHeader = req.headers.authorization;
        if (authHeader) {
            try {
                const decoded = jwt.verify(authHeader, 'secretKey');
                userId = decoded.id;
            } catch {}
        }

        // Kiểm tra stock từng món
        for (const item of items) {
            const menuItem = await menuItemModel.findById(item.menuItemId);
            if (!menuItem) return res.status(404).send({ message: `Món không tồn tại` });
            if (!menuItem.isAvailable) return res.status(400).send({ message: `Món "${menuItem.name}" đã hết hàng` });
            if (menuItem.stock !== undefined && menuItem.stock < item.quantity) {
                return res.status(400).send({ message: `Món "${menuItem.name}" chỉ còn ${menuItem.stock} phần` });
            }
        }

        // Kiểm tra đơn đang active của bàn (pending hoặc open) để gộp món
        let order = await orderModel.findOne({
            table: tableId,
            status: { $in: ['pending', 'open'] },
            isDeleted: false
        });

        if (!order) {
            order = new orderModel({ table: tableId, status: 'pending', user: userId });
            await order.save();
        }

        // Tạo order details + trừ stock
        for (const item of items) {
            // Nếu món đã có trong đơn thì tăng số lượng, không tạo mới
            const existing = await orderDetailModel.findOne({ order: order._id, menuItem: item.menuItemId });
            if (existing) {
                await orderDetailModel.findByIdAndUpdate(existing._id, { $inc: { quantity: item.quantity } });
            } else {
                await orderDetailModel.create({
                    order: order._id,
                    menuItem: item.menuItemId,
                    quantity: item.quantity,
                    price: item.price
                });
            }
            // Trừ stock
            await menuItemModel.findByIdAndUpdate(item.menuItemId, {
                $inc: { stock: -item.quantity }
            });
            // Nếu stock về 0 thì đánh dấu hết hàng
            const updated = await menuItemModel.findById(item.menuItemId);
            if (updated.stock <= 0) {
                await menuItemModel.findByIdAndUpdate(item.menuItemId, { isAvailable: false });
            }
        }

        await tableModel.findByIdAndUpdate(tableId, { status: 'occupied' });
        res.send({ message: 'Gọi món thành công', orderId: order._id });
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// Tạo order (admin/staff)
router.post('/', async (req, res) => {
    try {
        const order = new orderModel(req.body);
        await order.save();
        await tableModel.findByIdAndUpdate(req.body.table, { status: 'occupied' });
        res.send(order);
    } catch (err) { res.status(400).send({ message: err.message }); }
});

// Thêm món vào order
router.post('/:id/items', async (req, res) => {
    try {
        const detail = new orderDetailModel({
            order: req.params.id,
            menuItem: req.body.menuItem,
            quantity: req.body.quantity,
            price: req.body.price,
            note: req.body.note
        });
        await detail.save();
        res.send(detail);
    } catch (err) { res.status(400).send({ message: err.message }); }
});

// Xác nhận đơn pending → open
router.put('/:id/confirm', async (req, res) => {
    try {
        const order = await orderModel.findByIdAndUpdate(req.params.id, { status: 'open' }, { new: true });
        if (!order) return res.status(404).send({ message: 'Not found' });
        res.send(order);
    } catch (err) { res.status(400).send({ message: err.message }); }
});

// Huỷ đơn
router.put('/:id/cancel', async (req, res) => {
    try {
        const order = await orderModel.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
        if (!order) return res.status(404).send({ message: 'Not found' });
        await tableModel.findByIdAndUpdate(order.table, { status: 'available' });
        res.send(order);
    } catch (err) { res.status(400).send({ message: err.message }); }
});

// Đóng order
router.put('/:id/close', async (req, res) => {
    try {
        const order = await orderModel.findByIdAndUpdate(req.params.id, { status: 'closed' }, { new: true });
        if (!order) return res.status(404).send({ message: 'Not found' });
        await tableModel.findByIdAndUpdate(order.table, { status: 'available' });
        res.send(order);
    } catch (err) { res.status(400).send({ message: err.message }); }
});

// Khách yêu cầu thanh toán (từ home.html)
// Body: { method: 'cash'|'transfer', discountCode?, finalAmount }
router.patch('/:id/request-payment', async (req, res) => {
    try {
        const { method, discountCode, discountAmount, finalAmount } = req.body;
        if (!method) return res.status(400).send({ message: 'Thiếu phương thức thanh toán' });

        const order = await orderModel.findById(req.params.id);
        if (!order) return res.status(404).send({ message: 'Not found' });
        if (!['open', 'pending'].includes(order.status)) {
            return res.status(400).send({ message: 'Đơn hàng không ở trạng thái hợp lệ' });
        }

        order.status = 'waiting_payment';
        order.paymentMethod = method;
        if (discountCode) order.discountCode = discountCode;
        if (discountAmount !== undefined) order.discountAmount = discountAmount;
        if (finalAmount !== undefined) order.finalAmount = finalAmount;
        await order.save();

        res.send({ message: 'Đã gửi yêu cầu thanh toán', order });
    } catch (err) { res.status(400).send({ message: err.message }); }
});

// Nhân viên duyệt thanh toán → đóng đơn, giải phóng bàn, tạo invoice
router.patch('/:id/approve-payment', async (req, res) => {
    try {
        const invoiceModel = require('../schemas/invoices');
        const orderDetailModel = require('../schemas/orderDetails');
        const discountModel = require('../schemas/discounts');

        const order = await orderModel.findById(req.params.id).populate('table');
        if (!order) return res.status(404).send({ message: 'Not found' });
        if (order.status !== 'waiting_payment') {
            return res.status(400).send({ message: 'Đơn chưa ở trạng thái chờ thanh toán' });
        }

        // Kiểm tra đã có invoice chưa
        const existing = await invoiceModel.findOne({ order: order._id, isDeleted: false });
        if (existing) return res.status(400).send({ message: 'Đơn hàng đã được xuất hóa đơn' });

        const details = await orderDetailModel.find({ order: order._id });
        const totalAmount = details.reduce((sum, d) => sum + d.price * d.quantity, 0);

        let discountAmount = order.discountAmount || 0;
        // Tính lại nếu có mã giảm giá (để đảm bảo chính xác)
        if (order.discountCode) {
            try {
                const { applyDiscount } = require('../utils/discountHelper');
                const result = await applyDiscount(order.discountCode, totalAmount);
                discountAmount = result.discountAmount;
            } catch { /* mã có thể đã hết hạn sau khi request, dùng giá trị đã lưu */ }
        }
        const finalAmount = Math.max(0, totalAmount - discountAmount);

        const invoice = new invoiceModel({
            order: order._id,
            totalAmount,
            discount: discountAmount,
            finalAmount,
            discountCode: order.discountCode || undefined,
            paymentMethod: order.paymentMethod
        });
        await invoice.save();

        order.status = 'closed';
        order.finalAmount = finalAmount;
        await order.save();

        await tableModel.findByIdAndUpdate(order.table._id || order.table, { status: 'available' });

        res.send({ message: 'Đã duyệt thanh toán', invoice });
    } catch (err) { res.status(400).send({ message: err.message }); }
});

module.exports = router;
