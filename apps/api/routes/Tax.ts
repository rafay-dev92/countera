import express from "express";
const router = express.Router();
import { db, taxes, users } from "../db";
import { pickColumns } from "../db/helpers";
import { eq, ne, and, isNotNull } from "drizzle-orm";
import { UserRole } from "@countera/shared";
import fetchUser from "../middlewares/fetchUser";
import "dotenv/config";

router.get('/', fetchUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await db.query.users.findFirst({
            where: and(eq(users.id, userId), ne(users.role, UserRole.SUPER_ADMIN), isNotNull(users.BusinessId)),
        })

        if (user) {
            const taxList = await db.query.taxes.findMany({
                where: eq(taxes.BusinessId, user.BusinessId!),
                with: { Business: true }
            });
            return res.json(taxList);
        }

        const taxList = await db.query.taxes.findMany({
            with: { Business: true }
        });
        return res.json(taxList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/:id', fetchUser, async (req, res) => {
    try {
        const tax = await db.query.taxes.findFirst({ where: eq(taxes.id, req.params.id) });

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
        const existingTax = await db.query.taxes.findFirst({
            where: and(eq(taxes.name, taxData.name), eq(taxes.BusinessId, taxData.BusinessId))
        });

        if (existingTax) {
            res.status(409).json({ message: 'Tax with this name already exists' });
        }

        if (taxData.default) {
            const DefaultTax = await db.query.taxes.findFirst({
                where: and(eq(taxes.default, true), eq(taxes.BusinessId, taxData.BusinessId))
            });
            if (DefaultTax) {
                await db.update(taxes).set({ default: false }).where(eq(taxes.id, DefaultTax.id));
            }
        }

        await db.insert(taxes).values(pickColumns(taxes, taxData));
        res.status(200).json({ message: "Tax created successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.put('/update/:id', fetchUser, async (req, res) => {
    try {
        const tax = await db.query.taxes.findFirst({ where: eq(taxes.id, req.params.id) });

        if (!tax) {
            return res.status(404).json({ message: 'tax not found' });
        }

        if (req.body.default) {
            const DefaultTax = await db.query.taxes.findFirst({
                where: and(eq(taxes.default, true), eq(taxes.BusinessId, tax.BusinessId!))
            });
            console.log(DefaultTax);
            if (DefaultTax) {
                await db.update(taxes).set({ default: false }).where(eq(taxes.id, DefaultTax.id));
            }
        }

        const updates = pickColumns(taxes, req.body);
        if (Object.keys(updates).length) {
            await db.update(taxes).set(updates).where(eq(taxes.id, req.params.id));
        }

        res.status(200).json({ message: 'Tax updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.delete('/delete/:id', fetchUser, async (req, res) => {
    try {
        const tax = await db.query.taxes.findFirst({ where: eq(taxes.id, req.params.id) });

        if (!tax) {
            return res.status(404).json({ message: 'tax not found' });
        }

        await db.delete(taxes).where(eq(taxes.id, req.params.id));

        res.status(200).json({ message: 'Tax deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting tax' });
    }
})

export default router;
