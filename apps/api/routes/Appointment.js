const express = require("express");
const router = express.Router();
const { Appointment, User } = require("../models");
require("dotenv").config();
const { Op } = require("sequelize");
const fetchUser = require("../middlewares/fetchUser");
const sendMail = require("../utils/sendMail");
const moment = require("moment-timezone");
const authorizePermission = require("../middlewares/authorizePermissions");

router.get(
  "/",
  fetchUser,
  authorizePermission("appointment:read"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findOne({
        where: {
          id: userId,
          role: { [Op.ne]: "super-admin" },
          BusinessId: { [Op.ne]: null },
        },
      });

      if (user) {
        const appointments = await Appointment.findAll({
          where: { BusinessId: user.dataValues.BusinessId },
          include: ["Business"],
          order: [["createdAt", "ASC"]],
        });
        return res.status(200).json(appointments);
      }

      const appointments = await Appointment.findAll({
        include: ["Business"],
        order: [["createdAt", "ASC"]],
      });
      return res.status(200).json(appointments);
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
      const user = await User.findOne({
        where: {
          id: userId,
          role: { [Op.ne]: "super-admin" },
          BusinessId: { [Op.ne]: null },
        },
        include: ["Business"],
      });

      if (!user) return res.status(401).send("Unauthorized");
      const timezone = user.Business?.timezone;
      const startOfDay = moment().tz(timezone).startOf("day").toDate();
      const endOfDay = moment().tz(timezone).endOf("day").toDate();

      const appointments = await Appointment.findAll({
        where: {
          BusinessId: user.Business.id,
          startDateTime: {
            [Op.between]: [startOfDay, endOfDay],
          },
        },
        include: ["Business"],
        order: [["createdAt", "ASC"]],
      });
      return res
        .status(200)
        .json({ message: "Daily appointments fetched", data: appointments });
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
      const appointment = await Appointment.findByPk(req.params.id);

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
      const existingAppointment = await Appointment.findOne({
        where: {
          [Op.or]: [
            {
              [Op.and]: [
                {
                  startDateTime: {
                    [Op.between]: [
                      req.body.startDateTime,
                      req.body.endDateTime,
                    ],
                  },
                },
                { BusinessId: { [Op.eq]: req.body.BusinessId } },
              ],
            },
            {
              [Op.and]: [
                {
                  endDateTime: {
                    [Op.between]: [
                      req.body.startDateTime,
                      req.body.endDateTime,
                    ],
                  },
                },
                { BusinessId: { [Op.eq]: req.body.BusinessId } },
              ],
            },
            {
              [Op.and]: [
                { startDateTime: { [Op.gt]: req.body.startDateTime } },
                { endDateTime: { [Op.lt]: req.body.endDateTime } },
                { BusinessId: { [Op.eq]: req.body.BusinessId } },
              ],
            },
          ],
        },
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
        await Appointment.create(usefulData);
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
      const appointment = await Appointment.findByPk(req.params.id);

      if (!appointment) {
        return res.status(404).json({ message: "appointment not found" });
      }

      const existingAppointment = await Appointment.findOne({
        where: {
          [Op.and]: [
            { id: { [Op.ne]: req.params.id } },
            {
              [Op.or]: [
                {
                  startDateTime: {
                    [Op.between]: [
                      req.body.startDateTime,
                      req.body.endDateTime,
                    ],
                  },
                },
                {
                  endDateTime: {
                    [Op.between]: [
                      req.body.startDateTime,
                      req.body.endDateTime,
                    ],
                  },
                },
              ],
            },
          ],
        },
      });

      if (existingAppointment) {
        return res
          .status(409)
          .json({ message: "Appointment with this schedule already exists" });
      }

      await appointment.update(req.body);

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
      const appointment = await Appointment.findByPk(req.params.id);

      if (!appointment) {
        return res.status(404).json({ message: "appointment not found" });
      }

      await appointment.destroy();

      res.status(200).json({ message: "Appointment deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error deleting appointment" });
    }
  }
);

module.exports = router;
