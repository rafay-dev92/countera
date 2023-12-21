const express = require('express');
const router = express.Router();
const { User, Permission } = require('../models');
const { body, validationResult } = require('express-validator');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

router.get('/', async (req, res) => {
    try {
        const user = await User.findAll({
            include: ['Permission', 'Business']
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            include: ['Permission', 'Business']
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/signup', [
    body('user.email', 'Enter a valid email').isEmail(),
    body('user.password', 'Password must be atleast 5 characters long').isLength({ min: 5 }),
],
    async (req, res) => {
    //Checking whether request is normal
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ "errors": errors.array() })
    }

    try {
        const userData = req.body.user;
        const existingUser = await User.findOne({
            where: { email: userData.email }
        });

        if (existingUser) {
            res.status(409).json({ message: 'Email already exists' });
        } else {
            const salt = await bcryptjs.genSalt(10);
            const secPass = await bcryptjs.hash(userData.password, salt);

            const newUser = await User.create({
                ...userData,
                password: secPass
            });

            if (req.body.permissions.length !== 0) {
                console.log(req.body.permissions)
                req.body.permissions.map(async (item) => {
                    const permission = await Permission.findByPk(item);
                    newUser.addPermission(permission)
                })
            }

            res.json(newUser);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.post('/add_permission', async (req, res) => {
    try {
        const user = await User.findByPk(req.body.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (req.body.permission.length !== 0) {
            req.body.permissions.map( async (item) => {
                const permission = await Permission.findByPk(item);
                user.addPermission(permission);
            })
        }

        res.json({ message: 'permissions added to user successfully' })

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
    }
})

router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ where: { email: req.body.email } });

        if (!user) {
            return res.status(404).json({ "error": "Please provide correct credentials" });
        }

        const passMatch = await bcryptjs.compare(req.body.password, user.password);

        if (!passMatch) {
            return res.status(404).send("Please provide correct credentials");
        }

        const data = {
            user: {
                id: user.id
            }
        }

        const token = jwt.sign(data, process.env.JWT_SECRET, { expiresIn: 30 * 60 });

        res.send({ token: token, sessionExpire: Date.now() + (30 * 60 * 1000) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error login user' });
    }

})

router.put('/update/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.update(req.body);

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating user' });
    }
})

router.delete('/delete/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting user' });
    }
})

router.delete('/delete_permission', async (req, res) => {
    try {
        const user = await User.findByPk(req.body.userId);
        const permission = await Permission.findByPk(req.body.permissionId);

        user.removePermission(permission);
        res.json({ message: 'permission removed from user successfully' })

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error removing permission from user' });
    }
})

module.exports = router;