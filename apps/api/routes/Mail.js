const express = require("express");
const sendMail = require("../utils/sendMail");
const router = express.Router();
const multer = require("multer");

const upload = multer();

router.post("/send/invoice", upload.single("pdf"), async (req, res) => {
  try {
    if (req.body.customerEmail === "") return res.status(400).json({ message: "Customer Email is missing" });
    if (req.body.businessEmail === "") return res.status(400).json({ message: "Business Email is missing" });
    const mailOptions = {
      from: req.body.businessEmail,
      to: req.body.customerEmail,
      subject: "Your Invoice",
      text: `<h6>Hey ${req.body.customerName}!</h6>
            <p>Thanks for choosing us, Please find the attached invoice below.</p>
            <p>Have a nice day!</p>`,
      html: `<h6>Hey ${req.body.customerName}!</h6>
            <p>Thanks for choosing us, Please find the attached invoice below.</p>
            <p>Have a nice day!</p>`,
      attachments: [
        {
          filename: "invoice.pdf",
          content: req.file.buffer,
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
      if (req.body.customerEmail === "" || req.body.businessEmail === "") {
        return res.status(400).json({ message: "Customer or Business Email is missing" });
      }
      const mailOptions = {
        from: req.body.businessEmail,
        to: req.body.customerEmail,
        subject: "Your Quotation",
        text: `<h6>Hey ${req.body.customerName}!</h6>
              <p>Thanks for choosing us, Please find the attached quotation below.</p>
              <p>Have a nice day!</p>`,
        html: `<h6>Hey ${req.body.customerName}!</h6>
              <p>Thanks for choosing us, Please find the attached quotation below.</p>
              <p>Have a nice day!</p>`,
        attachments: [
          {
            filename: "quotation.pdf",
            content: req.file.buffer,
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

module.exports = router;
