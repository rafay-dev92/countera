const express = require("express");
const router = express.Router();
const { Appointment, User } = require("../models");
require("dotenv").config();
const { Op } = require("sequelize");
const nodemailer = require("nodemailer");
const fetchUser = require("../middlewares/fetchUser");

router.get("/", fetchUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findOne({
      where: {
        id: userId,
        role: { [Op.ne]: "super_admin" },
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
});

router.get("/:id", fetchUser, async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/create", fetchUser, async (req, res) => {
  try {
    const appointmentData = req.body;
    const existingAppointment = await Appointment.findOne({
      where: {
        [Op.or]: [
          {
            [Op.and]: [
              {
                startDateTime: {
                  [Op.between]: [req.body.startDateTime, req.body.endDateTime],
                },
              },
              { BusinessId: { [Op.eq]: req.body.BusinessId } },
            ],
          },
          {
            [Op.and]: [
              {
                endDateTime: {
                  [Op.between]: [req.body.startDateTime, req.body.endDateTime],
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
      const newAppointment = await Appointment.create(appointmentData);
    //   if (newAppointment.sendEmail) {
        let transporter = nodemailer.createTransport({
          host: "smtp.sendgrid.net",
          port: 587,
          auth: {
            user: "apikey",
            pass: process.env.SENDGRID_API_KEY,
          },
        });
        
        const mailOptions = {
          from: "rafaywork93@gmail.com",
          to: appointmentData.customerEmail,
          subject: "Appointment Confirmed",
          text: `${
            appointmentData.customerName
          } your appointment has been scheduled on ${
            appointmentData.startDateTime.split("T")[0]
          } at ${appointmentData.startDateTime.split("T")[1]} 
                    Thanks and Have a nice day!`,
          html: `<h6>Hey ${appointmentData.customerName}!</h6>
                    <p>Your appointment has been scheduled on <b>${
                      appointmentData.startDateTime.split("T")[0]
                    }</b> at <b>${appointmentData.startDateTime.split("T")[1]}</b></p>
                    <p>Have a nice day!</p>`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
          }
        });
    //   }
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
});

router.put("/update/:id", fetchUser, async (req, res) => {
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
                  [Op.between]: [req.body.startDateTime, req.body.endDateTime],
                },
              },
              {
                endDateTime: {
                  [Op.between]: [req.body.startDateTime, req.body.endDateTime],
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
});

router.delete("/delete/:id", fetchUser, async (req, res) => {
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
});

module.exports = router;
