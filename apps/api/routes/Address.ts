import express from "express";
const router = express.Router();
import { db, addresses } from "../db";
import { pickColumns } from "../db/helpers";
import { eq } from "drizzle-orm";
import fetchUser from "../middlewares/fetchUser";
import "dotenv/config";

router.get('/', fetchUser, async (req, res) => {
    try {
        const addressRows = await db.query.addresses.findMany();
        res.json(addressRows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/:id', fetchUser, async (req, res) => {
    try {
        const address = await db.query.addresses.findFirst({
            where: eq(addresses.id, req.params.id),
        });

        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        res.json(address);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.post('/create', async (req, res) => {
    try {
        const addressData = req.body;
        const [newAddress] = await db
            .insert(addresses)
            .values(pickColumns(addresses, addressData))
            .returning();
        res.json(newAddress);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.put('/update/:id', async (req, res) => {
    try {
        const address = await db.query.addresses.findFirst({
            where: eq(addresses.id, req.params.id),
        });

        if (!address) {
            return res.status(404).json({ message: 'address not found' });
        }

        const updates = pickColumns(addresses, req.body);
        if (Object.keys(updates).length) {
            await db
                .update(addresses)
                .set(updates)
                .where(eq(addresses.id, req.params.id));
        }

        res.json({ message: 'Address updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})

router.delete('/delete/:id', async (req, res) => {
    try {
        const address = await db.query.addresses.findFirst({
            where: eq(addresses.id, req.params.id),
        });

        if (!address) {
            return res.status(404).json({ message: 'address not found' });
        }

        await db.delete(addresses).where(eq(addresses.id, req.params.id));

        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting permission' });
    }
})

export default router;