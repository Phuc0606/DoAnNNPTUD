var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let mongoose = require('mongoose');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api/v1/users', require('./routes/users.layered'));
app.use('/api/v1/categories', require('./routes/categories'));
app.use('/api/v1/products', require('./routes/products'));
app.use('/api/v1/roles', require('./routes/roles'));
app.use('/api/v1/auth', require('./routes/auth.layered'));
app.use('/api/v1/carts', require('./routes/carts'));
app.use('/api/v1/upload', require('./routes/uploads'));
app.use('/api/v1/inventories', require('./routes/inventories'));
app.use('/api/v1/import', require('./routes/import.layered'));
app.use('/api/v1/customers', require('./routes/customers'));
app.use('/api/v1/tables', require('./routes/tables'));
app.use('/api/v1/reservations', require('./routes/reservations'));
app.use('/api/v1/menu-items', require('./routes/menuItems'));
app.use('/api/v1/orders', require('./routes/orders'));
app.use('/api/v1/invoices', require('./routes/invoices'));
app.use('/api/v1/payments', require('./routes/payments'));
app.use('/api/v1/discounts', require('./routes/discounts'));
app.use('/api/v1/seed', require('./routes/seed'));

mongoose.connect('mongodb://localhost:27017/DACKNHAHANG');
mongoose.connection.on('connected', () => console.log('MongoDB connected'));
mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));

// 404 handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler — trả JSON, không render view
app.use(function (err, req, res, next) {
  res.status(err.status || 500).json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  });
});

module.exports = app;
