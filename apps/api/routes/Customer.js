const express = require('express');
const router = express.Router();
const { Customer } = require('../models');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

router.get('/', async (req, res) => {
    try {
        const customer = await Customer.findAll({
            include: ['Business']
        });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/:id', async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id, {
            include: ['Business']
        });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/create', [
    body('email', 'Enter a valid email').isEmail(),
],
    async (req, res) => {
    //Checking whether request is normal
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ "errors": errors.array() })
    }

    try {
        const customerData = req.body;
        const existingCustomer = await Customer.findOne({
            where: { email: customerData.email }
        });

        if (existingCustomer) {
            res.status(409).json({ message: 'Email already exists' });
        } 

        const newCustomer = await Customer.create(customerData);
        res.json(newCustomer);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})



router.put('/update/:id', async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        await customer.update(req.body);

        res.json({ message: 'Customer updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating customer' });
    }
})

router.delete('/delete/:id', async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        await customer.destroy();
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting customer' });
    }
})

module.exports = router;