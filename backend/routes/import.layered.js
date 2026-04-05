const express = require('express');
const router = express.Router();
const multer = require('multer');
const ExcelJS = require('exceljs');
const crypto = require('crypto');

const userService = require('../services/users');
const roleRepository = require('../repositories/roleRepository');
const { sendPasswordMail } = require('../utils/mailHandler');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/users', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: "No file uploaded" });
        }

        const userRole = await roleRepository.findByName("user");
        if (!userRole) {
            return res.status(404).send({ message: "Role 'user' not found. Please create it first." });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.worksheets[0];

        let results = [];
        let errors = [];

        for (let i = 2; i <= worksheet.rowCount; i++) {
            const row = worksheet.getRow(i);
            const username = row.getCell(1).value;
            const email = row.getCell(2).value;

            if (!username || !email) {
                continue;
            }

            const password = crypto.randomBytes(8).toString('hex');

            try {
                await userService.CreateAnUser(username, password, email, userRole._id, null);
                sendPasswordMail(email, username, password).catch((error) => console.log('mail error:', error));
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
