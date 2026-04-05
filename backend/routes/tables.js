const express = require('express');
const router = express.Router();
const model = require('../schemas/tables');

router.get('/', async (req, res) => {
    res.send(await model.find({ isDeleted: false }));
});
router.get('/:id', async (req, res) => {
    try {
        const item = await model.findOne({ _id: req.params.id, isDeleted: false });
        if (!item) return res.status(404).send({ message: 'Not found' });
        res.send(item);
    } catch { res.status(404).send({ message: 'Not found' }); }
});
router.post('/', async (req, res) => {
    try {
        const item = new model(req.body);
        await item.save();
        res.send(item);
    } catch (err) { res.status(400).send({ message: err.message }); }
});
router.put('/:id', async (req, res) => {
    try {
        const item = await model.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
