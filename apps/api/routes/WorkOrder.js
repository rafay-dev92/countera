const express = require('express');
const router = express.Router();
const { WorkOrder } = require('../models');
require('dotenv').config();

router.get('/', async (req, res) => {
    try {
        const workorders = await WorkOrder.findAll({
            include: ['Customer', 'Vehicle']
        });
        res.json(workorders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/:id', async (req, res) => {
    try {
        const workorder = await WorkOrder.findByPk(req.params.id,{
            include: ['Customer', 'Vehicle']
        });

        if (!workorder) {
            return res.status(404).json({ message: 'workorder not found' });
        }

        res.json(workorder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/create', async (req, res) => {
    try {
        const workorderData = req.body;
       
        const newWorkOrder = await WorkOrder.create(workorderData);
        res.json(newWorkOrder);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.put('/update/:id', async (req, res) => {
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

router.delete('/delete/:id', async (req, res) => {
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