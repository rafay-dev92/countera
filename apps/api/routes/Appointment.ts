import express from "express";
const router = express.Router();
import { db, appointments, users } from "../db";
import { pickColumns } from "../db/helpers";
import "dotenv/config";
import { eq, ne, and, or, gt, lt, gte, lte, isNotNull, asc, } from "drizzle-orm";
import { UserRole } from "@countera/shared";
import fetchUser from "../middlewares/fetchUser";
import sendMail from "../utils/sendMail";
import moment from "moment-timezone";
import authorizePermission from "../middlewares/authorizePermissions";

router.get(
  "/",
  fetchUser,
  authorizePermission("appointment:read"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.id, userId),
          ne(users.role, UserRole.SUPER_ADMIN),
          isNotNull(users.BusinessId)
        ),
      });

      if (user) {
        const appointmentRows = await db.query.appointments.findMany({
          where: eq(appointments.BusinessId, user.BusinessId!),
          with: { Business: true },
          orderBy: [asc(appointments.createdAt)],
        });
        return res.status(200).json(appointmentRows);
      }

      const appointmentRows = await db.query.appointments.findMany({
        with: { Business: true },
        orderBy: [asc(appointments.createdAt)],
      });
      return res.status(200).json(appointmentRows);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get(
  "/today",
  fetchUser,
  authorizePermission("appointment:read"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.id, userId),
          ne(users.role, UserRole.SUPER_ADMIN),
          isNotNull(users.BusinessId)
        ),
        with: { Business: true },
      });

      if (!user) return res.status(401).send("Unauthorized");
      const timezone = user.Business?.timezone;
      const startOfDay = moment().tz(timezone!).startOf("day").toDate();
      const endOfDay = moment().tz(timezone!).endOf("day").toDate();

      const appointmentRows = await db.query.appointments.findMany({
        where: and(
          eq(appointments.BusinessId, user.Business!.id),
          gte(appointments.startDateTime, startOfDay),
          lte(appointments.startDateTime, endOfDay)
        ),
        with: { Business: true },
        orderBy: [asc(appointments.createdAt)],
      });
      return res
        .status(200)
        .json({ message: "Daily appointments fetched", data: appointmentRows });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get(
  "/:id",
  fetchUser,
  authorizePermission("appointment:view"),
  async (req, res) => {
    try {
      const appointment = await db.query.appointments.findFirst({
        where: eq(appointments.id, req.params.id),
      });

      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      res.status(200).json(appointment);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.post(
  "/create",
  fetchUser,
  authorizePermission("appointment:create"),
  async (req, res) => {
    try {
      const appointmentData = req.body;
      const existingAppointment = await db.query.appointments.findFirst({
        where: or(
          and(
            gte(
              appointments.startDateTime,
              new Date(req.body.startDateTime)
            ),
            lte(appointments.startDateTime, new Date(req.body.endDateTime)),
            eq(appointments.BusinessId, req.body.BusinessId)
          ),
          and(
            gte(appointments.endDateTime, new Date(req.body.startDateTime)),
            lte(appointments.endDateTime, new Date(req.body.endDateTime)),
            eq(appointments.BusinessId, req.body.BusinessId)
          ),
          and(
            gt(appointments.startDateTime, new Date(req.body.startDateTime)),
            lt(appointments.endDateTime, new Date(req.body.endDateTime)),
            eq(appointments.BusinessId, req.body.BusinessId)
          )
        ),
      });

      if (existingAppointment) {
        return res
          .status(409)
          .json({ message: "Appointment with this schedule already exists" });
      }

      if (
        req.body.customerName !== "" &&
        req.body.startDateTime !== "" &&
        req.body.endTime !== ""
      ) {
        const { BusinessEmail, BusinessName, ...usefulData } = appointmentData;
        await db
          .insert(appointments)
          .values(pickColumns(appointments, usefulData));
        //   if (newAppointment.sendEmail) {
        if (BusinessEmail === null) {
          return res.status(400).json({
            message:
              "Appointment scheduled, but email not sent to the customer as the business email is not set",
          });
        }

        const mailOptions = {
          from: `"${BusinessName}" <rafaywork93@gmail.com>`,
          to: appointmentData.customerEmail,
          replyTo: BusinessEmail,
          subject: "Appointment Confirmed",
          text: `${
            appointmentData.customerName
          } your appointment has been scheduled on ${
            appointmentData.startDateTime.split("T")[0]
          } at ${appointmentData.startDateTime.split("T")[1]}
                    Thanks and Have a nice day!`,
          html: `<h3>Hey ${appointmentData.customerName}!</h3>
                    <p>Your appointment has been scheduled on <b>${
                      appointmentData.startDateTime.split("T")[0]
                    }</b> at <b>${
            appointmentData.startDateTime.split("T")[1]
          }</b></p>
                    <p>Have a nice day!</p>`,
        };

        await sendMail(mailOptions);

        return res
          .status(200)
          .json({ message: "Appointment has been scheduled successfully" });
      }

      res
        .status(400)
        .json({ message: "All fields are required except description" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  "/update/:id",
  fetchUser,
  authorizePermission("appointment:update"),
  async (req, res) => {
    try {
      const appointment = await db.query.appointments.findFirst({
        where: eq(appointments.id, req.params.id),
      });

      if (!appointment) {
        return res.status(404).json({ message: "appointment not found" });
      }

      const existingAppointment = await db.query.appointments.findFirst({
        where: and(
          ne(appointments.id, req.params.id),
          or(
            and(
              gte(
                appointments.startDateTime,
                new Date(req.body.startDateTime)
              ),
              lte(appointments.startDateTime, new Date(req.body.endDateTime))
            ),
            and(
              gte(appointments.endDateTime, new Date(req.body.startDateTime)),
              lte(appointments.endDateTime, new Date(req.body.endDateTime))
            )
          )
        ),
      });

      if (existingAppointment) {
        return res
          .status(409)
          .json({ message: "Appointment with this schedule already exists" });
      }

      const updates = pickColumns(appointments, req.body);
      if (Object.keys(updates).length) {
        await db
          .update(appointments)
          .set(updates)
          .where(eq(appointments.id, req.params.id));
      }

      res.status(200).json({ message: "Appointment updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
);

router.delete(
  "/delete/:id",
  fetchUser,
  authorizePermission("appointment:delete"),
  async (req, res) => {
    try {
      const appointment = await db.query.appointments.findFirst({
        where: eq(appointments.id, req.params.id),
      });

      if (!appointment) {
        return res.status(404).json({ message: "appointment not found" });
      }

      await db.delete(appointments).where(eq(appointments.id, req.params.id));

      res.status(200).json({ message: "Appointment deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error deleting appointment" });
    }
  }
);

export default router;
