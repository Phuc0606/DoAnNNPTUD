const express = require('express');
const router = express.Router();
const model = require('../schemas/menuItems');
const { uploadImage } = require('../utils/uploadHandler');

router.get('/', async (req, res) => {
    res.send(await model.find({ isDeleted: false }).populate('category', 'name'));
});

router.get('/:id', async (req, res) => {
    try {
        const item = await model.findOne({ _id: req.params.id, isDeleted: false }).populate('category', 'name');
        if (!item) return res.status(404).send({ message: 'Not found' });
        res.send(item);
    } catch { res.status(404).send({ message: 'Not found' }); }
});

// Upload ảnh món ăn
router.post('/upload-image', uploadImage.single('image'), (req, res) => {
    if (!req.file) return res.status(400).send({ message: 'Không có file ảnh' });
    res.send({ imageUrl: `/api/v1/upload/${req.file.filename}` });
});

router.post('/', async (req, res) => {
    try {
        const body = req.body;
        if (body.stock !== undefined) body.isAvailable = body.stock > 0;
        const item = new model(body);
        await item.save();
        res.send(item);
    } catch (err) { res.status(400).send({ message: err.message }); }
});

router.put('/:id', async (req, res) => {
    try {
        const body = req.body;
        if (body.stock !== undefined) body.isAvailable = body.stock > 0;
        const item = await model.findByIdAndUpdate(req.params.id, body, { new: true });
        if (!item) return res.status(404).send({ message: 'Not found' });
        res.send(item);
    } catch (err) { res.status(400).send({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        const item = await model.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
        if (!item) return res.status(404).send({ message: 'Not found' });
        res.send(item);
    } catch (err) { res.status(400).send({ message: err.message }); }
});

module.exports = router;
