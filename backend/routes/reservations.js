const express = require('express');
const router = express.Router();
const reservationModel = require('../schemas/reservations');
const tableModel = require('../schemas/tables');
const orderModel = require('../schemas/orders');
const mailHandler = require('../utils/mailHandler');

// Lấy tất cả (sắp xếp gần nhất lên đầu)
router.get('/', async (req, res) => {
    res.send(await reservationModel.find({ isDeleted: false })
        .populate('table', 'number capacity')
        .sort({ reservationDate: 1 }));
});

router.get('/:id', async (req, res) => {
    try {
        const item = await reservationModel.findOne({ _id: req.params.id, isDeleted: false })
            .populate('table', 'number capacity');
        if (!item) return res.status(404).send({ message: 'Not found' });
        res.send(item);
    } catch { res.status(404).send({ message: 'Not found' }); }
});

// Tạo đặt bàn mới (từ khách hàng hoặc nhân viên)
// Body: { customerName, phone, email?, reservationDate, guestCount, note? }
router.post('/', async (req, res) => {
    try {
        const { customerName, phone, reservationDate, guestCount } = req.body;
        if (!customerName || !phone || !reservationDate || !guestCount) {
            return res.status(400).send({ message: 'Thiếu thông tin bắt buộc' });
        }

        const date = new Date(reservationDate);
        const now = new Date();

        // Không cho đặt trong quá khứ
        if (date <= now) {
            return res.status(400).send({ message: 'Không thể đặt bàn trong quá khứ' });
        }

        // Không cho đặt quá 30 ngày tới
        const maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        if (date > maxDate) {
            return res.status(400).send({ message: 'Chỉ có thể đặt bàn trước tối đa 30 ngày' });
        }

        const reservation = new reservationModel(req.body);
        await reservation.save();
        res.send(reservation);
    } catch (err) { res.status(400).send({ message: err.message }); }
});

// Nhân viên xác nhận + gán bàn
// Body: { tableId }
router.put('/:id/confirm', async (req, res) => {
    try {
        const { tableId } = req.body;
        if (!tableId) return res.status(400).send({ message: 'Vui lòng chọn bàn để gán' });

        const reservation = await reservationModel.findById(req.params.id);
        if (!reservation) return res.status(404).send({ message: 'Not found' });

        reservation.table = tableId;
        reservation.status = 'confirmed';
        await reservation.save();

        // Gửi email xác nhận nếu có email
        if (reservation.email) {
            try {
                const table = await tableModel.findById(tableId);
                await mailHandler.sendReservationConfirm(
                    reservation.email,
                    reservation.customerName,
                    table?.number,
                    reservation.reservationDate
                );
            } catch (e) { console.log('Mail error:', e.message); }
        }

        const populated = await reservationModel.findById(reservation._id).populate('table', 'number capacity');
        res.send(populated);
    } catch (err) { res.status(400).send({ message: err.message }); }
});

// Check-in: khách đến → bàn occupied + tạo order
router.put('/:id/checkin', async (req, res) => {
    try {
        const reservation = await reservationModel.findById(req.params.id).populate('table');
        if (!reservation) return res.status(404).send({ message: 'Not found' });
        if (reservation.status !== 'confirmed') {
            return res.status(400).send({ message: 'Chỉ có thể check-in đơn đã được xác nhận' });
        }
        if (!reservation.table) {
            return res.status(400).send({ message: 'Chưa gán bàn cho đặt chỗ này' });
        }

        reservation.status = 'checked_in';
        reservation.checkedInAt = new Date();
        await reservation.save();

        // Bàn → occupied
        await tableModel.findByIdAndUpdate(reservation.table._id, { status: 'occupied' });

        // Tạo order mới cho bàn
        const order = new orderModel({
            table: reservation.table._id,
            customer: reservation.customer || undefined,
            status: 'open'
        });
        await order.save();

        res.send({ reservation, orderId: order._id });
    } catch (err) { res.status(400).send({ message: err.message }); }
});

// Huỷ đặt bàn
router.put('/:id/cancel', async (req, res) => {
    try {
        const item = await reservationModel.findByIdAndUpdate(
            req.params.id, { status: 'cancelled' }, { new: true }
        );
        if (!item) return res.status(404).send({ message: 'Not found' });
        res.send(item);
    } catch (err) { res.status(400).send({ message: err.message }); }
});

// Đánh dấu no-show (khách không đến)
router.put('/:id/no-show', async (req, res) => {
    try {
        const item = await reservationModel.findByIdAndUpdate(
            req.params.id, { status: 'no_show' }, { new: true }
        );
        if (!item) return res.status(404).send({ message: 'Not found' });
        res.send(item);
    } catch (err) { res.status(400).send({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        await reservationModel.findByIdAndUpdate(req.params.id, { isDeleted: true });
        res.send({ message: 'Đã xoá' });
    } catch (err) { res.status(400).send({ message: err.message }); }
});

module.exports = router;
