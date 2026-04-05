const express = require('express')
let router = express.Router()
let inventorySchema = require('../schemas/inventories')

// GET ALL - join với product
router.get('/', async (req, res) => {
    try {
        let result = await inventorySchema.find().populate({
            path: 'product',
            select: 'title price images'
        })
        res.send(result)
    } catch (err) {
        res.status(400).send({ message: err.message })
    }
})

// GET BY ID - join với product
router.get('/:id', async (req, res) => {
    try {
        let result = await inventorySchema.findById(req.params.id).populate({
            path: 'product',
            select: 'title price images'
        })
        if (!result) return res.status(404).send({ message: "ID NOT FOUND" })
        res.send(result)
    } catch (err) {
        res.status(404).send({ message: "SOMETHING WENT WRONG" })
    }
})

// ADD STOCK
router.post('/add-stock', async (req, res) => {
    try {
        let { product, quantity } = req.body
        if (!quantity || quantity <= 0) return res.status(400).send({ message: "quantity phai lon hon 0" })
        let inventory = await inventorySchema.findOne({ product })
        if (!inventory) return res.status(404).send({ message: "Inventory not found" })
        inventory.stock += quantity
        await inventory.save()
        res.send(inventory)
    } catch (err) {
        res.status(400).send({ message: err.message })
    }
})

// REMOVE STOCK
router.post('/remove-stock', async (req, res) => {
    try {
        let { product, quantity } = req.body
        if (!quantity || quantity <= 0) return res.status(400).send({ message: "quantity phai lon hon 0" })
        let inventory = await inventorySchema.findOne({ product })
        if (!inventory) return res.status(404).send({ message: "Inventory not found" })
        if (inventory.stock < quantity) return res.status(400).send({ message: "stock khong du" })
        inventory.stock -= quantity
        await inventory.save()
        res.send(inventory)
    } catch (err) {
        res.status(400).send({ message: err.message })
    }
})

// RESERVATION
router.post('/reservation', async (req, res) => {
    try {
        let { product, quantity } = req.body
        if (!quantity || quantity <= 0) return res.status(400).send({ message: "quantity phai lon hon 0" })
        let inventory = await inventorySchema.findOne({ product })
        if (!inventory) return res.status(404).send({ message: "Inventory not found" })
        if (inventory.stock < quantity) return res.status(400).send({ message: "stock khong du de reservation" })
        inventory.stock -= quantity
        inventory.reserved += quantity
        await inventory.save()
        res.send(inventory)
    } catch (err) {
        res.status(400).send({ message: err.message })
    }
})

// SOLD
router.post('/sold', async (req, res) => {
    try {
        let { product, quantity } = req.body
        if (!quantity || quantity <= 0) return res.status(400).send({ message: "quantity phai lon hon 0" })
        let inventory = await inventorySchema.findOne({ product })
        if (!inventory) return res.status(404).send({ message: "Inventory not found" })
        if (inventory.reserved < quantity) return res.status(400).send({ message: "reserved khong du" })
        inventory.reserved -= quantity
        inventory.soldCount += quantity
        await inventory.save()
        res.send(inventory)
    } catch (err) {
        res.status(400).send({ message: err.message })
    }
})

module.exports = router
