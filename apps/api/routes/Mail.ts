import express from "express";
import sendMail from "../utils/sendMail";
const router = express.Router();
import multer from "multer";
import type { SendMailOptions } from "nodemailer";

const upload = multer();

// the middleware is runtime-identical, so bridge the type mismatch with a cast.
router.post("/send/invoice", upload.single("pdf"), async (req, res) => {
  try {
    if (req.body.customerEmail === "" || req.body.businessEmail === "") return res.status(400).json({ message: "Customer or Business Email is missing" });
    if (req.body.businessName === "") return res.status(400).json({ message: "Business Name is missing" });

    const mailOptions: SendMailOptions = {
      from: `"${req.body.businessName}" <${process.env.GMAIL_SMTP_EMAIL}>`,
      to: req.body.customerEmail,
      replyTo: req.body.businessEmail,
      subject: "Your Invoice",
      text: `<h3>Hey ${req.body.customerName}!</h3>
            <p>Thanks for choosing us, Please find the attached invoice below.</p>
            <p>Have a nice day!</p>`,
      html: `<h3>Hey ${req.body.customerName}!</h3>
            <p>Thanks for choosing us, Please find the attached invoice below.</p>
            <p>Have a nice day!</p>`,
      attachments: [
        {
          filename: "invoice.pdf",
          content: req.file!.buffer,
          contentType: "application/pdf",
        },
      ],
    };

    await sendMail(mailOptions);
    return res.status(200).json({ message: "Invoice sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/send/quotation", upload.single("pdf"), async (req, res) => {
  try {
    if (req.body.customerEmail === "" || req.body.businessEmail === "") return res.status(400).json({ message: "Customer or Business Email is missing" });
    if (req.body.businessName === "") return res.status(400).json({ message: "Business Name is missing" });

    const mailOptions: SendMailOptions = {
      from: `"${req.body.businessName}" <${process.env.GMAIL_SMTP_EMAIL}>`,
      to: req.body.customerEmail,
      replyTo: req.body.businessEmail,
      subject: "Your Quotation",
      text: `<h3>Hey ${req.body.customerName}!</h3>
              <p>Thanks for choosing us, Please find the attached quotation below.</p>
              <p>Have a nice day!</p>`,
      html: `<h3>Hey ${req.body.customerName}!</h3>
              <p>Thanks for choosing us, Please find the attached quotation below.</p>
              <p>Have a nice day!</p>`,
      attachments: [
        {
          filename: "quotation.pdf",
          content: req.file!.buffer,
          contentType: "application/pdf",
        },
      ],
    };

    await sendMail(mailOptions);
    return res.status(200).json({ message: "Quotation sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
