const express = require('express');
const router = express.Router();
const { Customer, User } = require('../models');
const fetchUser = require('../middlewares/fetchUser');
const { Op } = require('sequelize');
require('dotenv').config();


router.get('/', fetchUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findOne({
            where: { id: userId,  role: {[Op.ne]: 'super_admin'}, BusinessId: {[Op.ne]: null} },
        })
        if (user) {
            const customer = await Customer.findAll({
                where: {BusinessId: user.dataValues.BusinessId},
                include: ['Business', 'Address', 'Vehicle']
            });
            return res.json(customer);
        }
        const customer = await Customer.findAll({
            include: ['Business', 'Address', 'Vehicle']
        });
        return res.json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/:id', fetchUser, async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id, {
            include: ['Business', 'Address', 'Vehicle']
        });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/create', fetchUser,  async (req, res) => {
    try {
        const customerData = req.body;
        const existingCustomer = await Customer.findOne({
            where: { firstName: customerData.firstName, lastName: customerData.lastName, email: customerData.email }
        });

        if (existingCustomer) {
            return res.status(409).json({ message: 'Customer already exists with this email and name' });
        } 

        const customer = await Customer.create(customerData);
        return res.status(200).json({message: "Customer added successfully", data: customer});

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})



router.put('/update/:id', fetchUser, async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id, {
            include: ['Address']
        });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        await customer.update(req.body);

        return res.status(200).json({ message: 'Customer updated successfully', data: customer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating customer' });
    }
})

router.delete('/delete/:id', fetchUser, async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        await customer.destroy();
        return res.status(200).json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting customer' });
    }
})

module.exports = router;