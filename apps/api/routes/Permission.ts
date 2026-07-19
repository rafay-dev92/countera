import express from "express";
const router = express.Router();
import { db, permissions } from "../db";
import { pickColumns } from "../db/helpers";
import { eq, ne, desc } from "drizzle-orm";
import fetchUser from "../middlewares/fetchUser";
import "dotenv/config";

router.get('/', fetchUser, async (req, res) => {
    try {
        const permission = await db.query.permissions.findMany({
            where: ne(permissions.name, 'IS_SUPER_ADMIN'),
            orderBy: [desc(permissions.createdAt)],
        });
        res.json(permission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/:id', fetchUser, async (req, res) => {
    try {
        const permission = await db.query.permissions.findFirst({
            where: eq(permissions.id, req.params.id),
        });

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
        const existingPermission = await db.query.permissions.findFirst({
            where: eq(permissions.name, permissionData.name)
        });

        if (existingPermission) {
            res.status(409).json({ message: 'Permission with this name already exists' });
        } else {
            const [newPermission] = await db
                .insert(permissions)
                .values(pickColumns(permissions, permissionData))
                .returning();
            res.json(newPermission);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.put('/update/:id', async (req, res) => {
    try {
        const permission = await db.query.permissions.findFirst({
            where: eq(permissions.id, req.params.id),
        });

        if (!permission) {
            return res.status(404).json({ message: 'permission not found' });
        }

        const updates = pickColumns(permissions, req.body);
        if (Object.keys(updates).length) {
            await db
                .update(permissions)
                .set(updates)
                .where(eq(permissions.id, req.params.id));
        }

        res.json({ message: 'Permission updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.delete('/delete/:id', async (req, res) => {
    try {
        const permission = await db.query.permissions.findFirst({
            where: eq(permissions.id, req.params.id),
        });

        if (!permission) {
            return res.status(404).json({ message: 'Permission not found' });
        }

        await db.delete(permissions).where(eq(permissions.id, req.params.id));

        res.json({ message: 'Permission deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting permission' });
    }
})

export default router;