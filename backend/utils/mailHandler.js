const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    secure: false,
    auth: {
        user: "bab48827b56e93",
        pass: "52cf22276dbcc1",
    },
});

module.exports = {
    sendMail: async (to,url) => {
        const info = await transporter.sendMail({
            from: 'Admin@hahah.com',
            to: to,
            subject: "request resetpassword email",
            text: "click vao day de reset", // Plain-text version of the message
            html: "click vao <a href="+url+">day</a> de reset", // HTML version of the message
        });

        console.log("Message sent:", info.messageId);
    },
    sendPasswordMail: async (to, username, password) => {
        try {
            const info = await transporter.sendMail({
                from: 'Admin@hahah.com',
                to: to,
                subject: "Your Account Credentials",
                text: `Welcome ${username}! Your password is: ${password}`,
                html: `<p>Welcome <b>${username}</b>!</p><p>Your password is: <b>${password}</b></p>`,
            });
            console.log("Password email sent:", info.messageId);
        } catch (error) {
            console.error("Error sending password email:", error);
        }
    },
    sendReservationConfirm: async (to, customerName, tableNumber, reservationDate) => {
        try {
            const dateStr = new Date(reservationDate).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
            const info = await transporter.sendMail({
                from: 'NhaHang@nhahang.com',
                to: to,
                subject: '✅ Xác nhận đặt bàn thành công',
                html: `
                    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:12px">
                        <h2 style="color:#e74c3c">🍽️ Nhà Hàng ABC</h2>
                        <p>Xin chào <b>${customerName}</b>,</p>
                        <p>Đặt bàn của bạn đã được <b style="color:#27ae60">xác nhận</b>!</p>
                        <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:16px 0">
                            <p>🪑 <b>Bàn số:</b> ${tableNumber}</p>
                            <p>🕐 <b>Thời gian:</b> ${dateStr}</p>
                        </div>
                        <p>Vui lòng đến đúng giờ. Nếu cần thay đổi, hãy liên hệ: <b>0901 234 567</b></p>
                        <p style="color:#888;font-size:12px">© 2026 Nhà Hàng ABC</p>
                    </div>`
            });
            console.log("Reservation confirm email sent:", info.messageId);
        } catch (error) {
            console.error("Error sending reservation email:", error);
        }
    }
}