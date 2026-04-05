const express = require('express');
const router = express.Router();
const multer = require('multer');
const ExcelJS = require('exceljs');
const crypto = require('crypto');
const userController = require('../services/users');
const roleModel = require('../schemas/roles');
const { sendPasswordMail } = require('../utils/mailHandler');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/users', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: "No file uploaded" });
        }

        // Tìm role "user"
        let userRole = await roleModel.findOne({ name: "user" });
        if (!userRole) {
            return res.status(404).send({ message: "Role 'user' not found. Please create it first." });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.worksheets[0];

        let results = [];
        let errors = [];

        // Bỏ qua dòng header (row 1)
        for (let i = 2; i <= worksheet.rowCount; i++) {
            const row = worksheet.getRow(i);
            const username = row.getCell(1).value;
            const email = row.getCell(2).value;

            if (!username || !email) continue;

            // Tạo password random 16 ký tự
            const password = crypto.randomBytes(8).toString('hex');

            try {
                await userController.CreateAnUser(
                    username, password, email, userRole._id, null
                );

                // Gửi email song song, không chờ
                sendPasswordMail(email, username, password).catch(e => console.log('mail error:', e));

                results.push({ username, email, status: 'success' });
            } catch (err) {
                errors.push({ username, email, error: err.message });
            }
        }

        res.send({
            message: "Import completed",
            success: results.length,
            failed: errors.length,
            errors
        });
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;
