const express = require('express');
const router = express.Router();
const { Permission } = require('../models');
const fetchUser = require('../middlewares/fetchUser');
require('dotenv').config();

router.get('/', fetchUser, async (req, res) => {
    try {
        const permission = await Permission.findAll();
        res.json(permission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/:id', fetchUser, async (req, res) => {
    try {
        const permission = await Permission.findByPk(req.params.id);

        if (!permission) {
            return res.status(404).json({ message: 'Permission not found' });
        }

        res.json(permission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/create', async (req, res) => {
    try {
        const permissionData = req.body;
        const existingPermission = await Permission.findOne({
            where: { name: permissionData.name }
        });

        if (existingPermission) {
            res.status(409).json({ message: 'Permission with this name already exists' });
        } else {
            const newPermission = await Permission.create(permissionData);
            res.json(newPermission);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.put('/update/:id', async (req, res) => {
    try {
        const permission = await Permission.findByPk(req.params.id);

        if (!permission) {
            return res.status(404).json({ message: 'permission not found' });
        }

        await permission.update(req.body);

        res.json({ message: 'Permission updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.delete('/delete/:id', async (req, res) => {
    try {
        const permission = await Permission.findByPk(req.params.id);

        if (!permission) {
            return res.status(404).json({ message: 'Permission not found' });
        }

        await permission.destroy();

        res.json({ message: 'Permission deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting permission' });
    }
})

module.exports = router;