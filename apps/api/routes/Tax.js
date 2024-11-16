const express = require('express');
const router = express.Router();
const { Tax, User } = require('../models');
const fetchUser = require('../middlewares/fetchUser');
const { Op } = require('sequelize');
require('dotenv').config();

router.get('/', fetchUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findOne({
            where: { id: userId, role: { [Op.ne]: 'super_admin' }, BusinessId: { [Op.ne]: null } },
        })

        if (user) {
            const taxes = await Tax.findAll({
                where: { BusinessId: user.dataValues.BusinessId },
                include: ['Business']
            });
            return res.json(taxes);
        }

        const taxes = await Tax.findAll({
            include: ['Business']
        });
        return res.json(taxes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/:id', fetchUser, async (req, res) => {
    try {
        const tax = await Tax.findByPk(req.params.id);

        if (!tax) {
            return res.status(404).json({ message: 'Tax not found' });
        }

        res.json(tax);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/create', fetchUser, async (req, res) => {
    try {
        const taxData = req.body;
        const existingTax = await Tax.findOne({
            where: { name: taxData.name, BusinessId: taxData.BusinessId }
        });

        if (existingTax) {
            res.status(409).json({ message: 'Tax with this name already exists' });
        }

        if (taxData.default) {
            const DefaultTax = await Tax.findOne({ default: true, BusinessId: taxData.BusinessId });
            if (DefaultTax) {
                await DefaultTax.update({ default: false });
            }
        }

        await Tax.create(taxData);
        res.status(200).json({ message: "Tax created successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.put('/update/:id', fetchUser, async (req, res) => {
    try {
        const tax = await Tax.findByPk(req.params.id);

        if (!tax) {
            return res.status(404).json({ message: 'tax not found' });
        }

        if (req.body.default) {
            const DefaultTax = await Tax.findOne({ where: { default: true, BusinessId: tax.BusinessId } });
            console.log(DefaultTax);
            if (DefaultTax) {
                await DefaultTax.update({ default: false });
            }
        }

        await tax.update(req.body);

        res.status(200).json({ message: 'Tax updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.delete('/delete/:id', fetchUser, async (req, res) => {
    try {
        const tax = await Tax.findByPk(req.params.id);

        if (!tax) {
            return res.status(404).json({ message: 'tax not found' });
        }

        await tax.destroy();

        res.status(200).json({ message: 'Tax deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting tax' });
    }
})

module.exports = router;