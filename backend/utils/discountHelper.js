const discountModel = require('../schemas/discounts');

/**
 * Validate và tính số tiền giảm từ mã.
 * @returns { discountAmount, discountInfo } hoặc throw Error với message rõ ràng
 */
async function applyDiscount(code, totalAmount) {
    const discount = await discountModel.findOne({ code: code.toUpperCase(), isActive: true });
    if (!discount) throw { status: 404, message: 'Mã giảm giá không tồn tại hoặc đã bị vô hiệu' };

    const now = new Date();
    if (now < discount.startDate) throw { status: 400, message: 'Mã giảm giá chưa đến ngày áp dụng' };
    if (now > discount.expiryDate) throw { status: 400, message: 'Mã giảm giá đã hết hạn' };

    // Kiểm tra giá trị đơn tối thiểu
    if (discount.minOrderValue > 0 && totalAmount < discount.minOrderValue) {
        throw {
            status: 400,
            message: `Đơn hàng chưa đủ ${discount.minOrderValue.toLocaleString('vi-VN')}đ để áp dụng mã này`
        };
    }

    let discountAmount = discount.type === 'amount'
        ? discount.value
        : Math.round(totalAmount * discount.value / 100);

    // Không giảm quá tổng tiền → finalAmount tối thiểu là 0
    discountAmount = Math.min(discountAmount, totalAmount);

    return {
        discountAmount,
        discountInfo: {
            code: discount.code,
            type: discount.type,
            value: discount.value,
            minOrderValue: discount.minOrderValue
        }
    };
}

module.exports = { applyDiscount };
