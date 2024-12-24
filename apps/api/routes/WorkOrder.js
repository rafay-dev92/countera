const express = require('express');
const router = express.Router();
const { WorkOrder, User } = require('../models');
const fetchUser = require('../middlewares/fetchUser');
const { Op } = require('sequelize');
require('dotenv').config();

router.get('/', fetchUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findOne({
            where: { id: userId,  role: {[Op.ne]: 'super-admin'}, BusinessId: {[Op.ne]: null} },
        })

        if (user) {
            const workorders = await WorkOrder.findAll({
                where: {BusinessId: user.dataValues.BusinessId},
                include: ['Customer', 'Business']
            });
            return res.json(workorders);
        }

        const workorders = await WorkOrder.findAll({
            include: ['Customer', 'Business']
        });
        return res.json(workorders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/:id', fetchUser, async (req, res) => {
    try {
        const workorder = await WorkOrder.findByPk(req.params.id,{
            include: ['Customer', 'Business']
        });

        if (!workorder) {
            return res.status(404).json({ message: 'workorder not found' });
        }

        res.json(workorder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/create', fetchUser, async (req, res) => {
    try {
        const workorderData = req.body;
       
        const newWorkOrder = await WorkOrder.create(workorderData);
        res.json(newWorkOrder);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.put('/update/:id', fetchUser, async (req, res) => {
    try {
        const workorder = await WorkOrder.findByPk(req.params.id);

        if (!workorder) {
            return res.status(404).json({ message: 'workorder not found' });
        }

        await workorder.update(req.body);

        res.json({ message: 'WorkOrder updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.delete('/delete/:id', fetchUser, async (req, res) => {
    try {
        const workorder = await WorkOrder.findByPk(req.params.id);

        if (!workorder) {
            return res.status(404).json({ message: 'workorder not found' });
        }

        await workorder.destroy();

        res.json({ message: 'WorkOrder deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting workorder' });
    }
})

module.exports = router;