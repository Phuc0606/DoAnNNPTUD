const express = require('express');
const router = express.Router();
const roleModel = require('../schemas/roles');
const userModel = require('../schemas/users');
const categoryModel = require('../schemas/categories');
const menuItemModel = require('../schemas/menuItems');
const tableModel = require('../schemas/tables');
const customerModel = require('../schemas/customers');
const reservationModel = require('../schemas/reservations');
const orderModel = require('../schemas/orders');
const orderDetailModel = require('../schemas/orderDetails');
const invoiceModel = require('../schemas/invoices');
const paymentModel = require('../schemas/payments');
const slugify = require('slugify');

router.post('/', async (req, res) => {
    try {
        // 1. ROLES
        let adminRole = await roleModel.findOneAndUpdate(
            { name: 'admin' }, { name: 'admin' }, { upsert: true, new: true }
        );
        let userRole = await roleModel.findOneAndUpdate(
            { name: 'user' }, { name: 'user' }, { upsert: true, new: true }
        );
        let nhanvienRole = await roleModel.findOneAndUpdate(
            { name: 'nhanvien' }, { name: 'nhanvien' }, { upsert: true, new: true }
        );

        // 2. USERS
        let adminUser = await userModel.findOne({ username: 'admin' });
        if (!adminUser) {
            adminUser = new userModel({
                username: 'admin', password: 'Admin@123',
                email: 'admin@restaurant.com', role: adminRole._id, status: true
            });
            await adminUser.save();
        } else {
            // Force cập nhật role admin
            adminUser.role = adminRole._id;
            await adminUser.save();
        }
        let staffUser = await userModel.findOne({ username: 'nhanvien1' });
        if (!staffUser) {
            staffUser = new userModel({
                username: 'nhanvien1', password: 'Staff@123',
                email: 'nhanvien1@restaurant.com', role: nhanvienRole._id, status: true
            });
            await staffUser.save();
        }

        // 3. CATEGORIES
        const catNames = ['Khai vị', 'Món chính', 'Tráng miệng', 'Đồ uống'];
        const cats = [];
        for (const name of catNames) {
            const cat = await categoryModel.findOneAndUpdate(
                { name },
                { name, slug: slugify(name, { lower: true }) },
                { upsert: true, new: true }
            );
            cats.push(cat);
        }

        // 4. MENU ITEMS
        const menuData = [
            { name: 'Gỏi cuốn tôm thịt', price: 45000, category: cats[0]._id, description: 'Gỏi cuốn tươi ngon' },
            { name: 'Chả giò chiên', price: 55000, category: cats[0]._id, description: 'Giòn rụm thơm ngon' },
            { name: 'Súp cua', price: 65000, category: cats[0]._id, description: 'Súp cua béo ngậy' },
            { name: 'Cơm tấm sườn bì chả', price: 85000, category: cats[1]._id, description: 'Cơm tấm đặc biệt' },
            { name: 'Bún bò Huế', price: 75000, category: cats[1]._id, description: 'Bún bò cay đậm đà' },
            { name: 'Lẩu thái hải sản', price: 350000, category: cats[1]._id, description: 'Lẩu cho 2-4 người' },
            { name: 'Gà nướng muối ớt', price: 180000, category: cats[1]._id, description: 'Gà nướng thơm lừng' },
            { name: 'Chè ba màu', price: 35000, category: cats[2]._id, description: 'Chè mát lạnh' },
            { name: 'Bánh flan caramel', price: 40000, category: cats[2]._id, description: 'Mềm mịn thơm ngon' },
            { name: 'Nước cam tươi', price: 35000, category: cats[3]._id, description: 'Cam vắt tươi' },
            { name: 'Trà đào cam sả', price: 45000, category: cats[3]._id, description: 'Thơm mát' },
            { name: 'Bia Tiger', price: 30000, category: cats[3]._id, description: 'Lon 330ml' },
        ];
        const menuItems = [];
        for (const item of menuData) {
            const m = await menuItemModel.findOneAndUpdate(
                { name: item.name }, item, { upsert: true, new: true }
            );
            menuItems.push(m);
        }

        // 5. TABLES
        const tableData = [
            { number: 1, capacity: 2 }, { number: 2, capacity: 2 },
            { number: 3, capacity: 4 }, { number: 4, capacity: 4 },
            { number: 5, capacity: 4 }, { number: 6, capacity: 6 },
            { number: 7, capacity: 6 }, { number: 8, capacity: 8 },
            { number: 9, capacity: 10 }, { number: 10, capacity: 10 },
        ];
        const tables = [];
        for (const t of tableData) {
            const tbl = await tableModel.findOneAndUpdate(
                { number: t.number }, t, { upsert: true, new: true }
            );
            tables.push(tbl);
        }

        // 6. CUSTOMERS
        const customerData = [
            { name: 'Nguyễn Văn An', phone: '0901234567', email: 'an@gmail.com' },
            { name: 'Trần Thị Bình', phone: '0912345678', email: 'binh@gmail.com' },
            { name: 'Lê Văn Cường', phone: '0923456789', email: 'cuong@gmail.com' },
            { name: 'Phạm Thị Dung', phone: '0934567890', email: 'dung@gmail.com' },
            { name: 'Hoàng Văn Em', phone: '0945678901', email: 'em@gmail.com' },
        ];
        const customers = [];
        for (const c of customerData) {
            const cust = await customerModel.findOneAndUpdate(
                { phone: c.phone }, c, { upsert: true, new: true }
            );
            customers.push(cust);
        }

        // 7. RESERVATIONS
        const res1 = await reservationModel.findOneAndUpdate(
            { customer: customers[0]._id, table: tables[2]._id },
            { customer: customers[0]._id, table: tables[2]._id, date: new Date(Date.now() + 2 * 60 * 60 * 1000), guestCount: 4, status: 'confirmed', note: 'Sinh nhật' },
            { upsert: true, new: true }
        );
        const res2 = await reservationModel.findOneAndUpdate(
            { customer: customers[1]._id, table: tables[4]._id },
            { customer: customers[1]._id, table: tables[4]._id, date: new Date(Date.now() + 5 * 60 * 60 * 1000), guestCount: 3, status: 'pending' },
            { upsert: true, new: true }
        );

        // 8. ORDERS + ORDER DETAILS + INVOICE + PAYMENT (1 đơn hoàn chỉnh)
        let order1 = await orderModel.findOne({ table: tables[0]._id, status: 'closed' });
        if (!order1) {
            order1 = new orderModel({ table: tables[0]._id, customer: customers[2]._id, status: 'closed' });
            await order1.save();
            await orderDetailModel.insertMany([
                { order: order1._id, menuItem: menuItems[3]._id, quantity: 2, price: menuItems[3].price },
                { order: order1._id, menuItem: menuItems[10]._id, quantity: 2, price: menuItems[10].price },
                { order: order1._id, menuItem: menuItems[7]._id, quantity: 2, price: menuItems[7].price },
            ]);
            const details = await orderDetailModel.find({ order: order1._id });
            const total = details.reduce((s, d) => s + d.price * d.quantity, 0);
            const inv = new invoiceModel({ order: order1._id, totalAmount: total, discount: 20000, finalAmount: total - 20000 });
            await inv.save();
            await paymentModel.create({ invoice: inv._id, method: 'cash', amount: inv.finalAmount, status: 'paid' });
        }

        // 1 đơn đang mở
        let order2 = await orderModel.findOne({ table: tables[1]._id, status: 'open' });
        if (!order2) {
            order2 = new orderModel({ table: tables[1]._id, customer: customers[3]._id, status: 'open' });
            await order2.save();
            await tableModel.findByIdAndUpdate(tables[1]._id, { status: 'occupied' });
            await orderDetailModel.insertMany([
                { order: order2._id, menuItem: menuItems[4]._id, quantity: 1, price: menuItems[4].price },
                { order: order2._id, menuItem: menuItems[11]._id, quantity: 2, price: menuItems[11].price },
            ]);
        }

        // Fix isAvailable theo stock
        await menuItemModel.updateMany({ stock: 0 }, { isAvailable: false });
        await menuItemModel.updateMany({ stock: { $gt: 0 } }, { isAvailable: true });

        res.send({
            message: '✅ Seed data thành công!',
            data: {
                roles: 2, users: 2, categories: cats.length,
                menuItems: menuItems.length, tables: tables.length,
                customers: customers.length, reservations: 2,
                orders: 2, invoices: 1, payments: 1
            },
            accounts: [
                { username: 'admin', password: 'Admin@123', role: 'admin' },
                { username: 'nhanvien1', password: 'Staff@123', role: 'user' }
            ]
        });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

module.exports = router;
