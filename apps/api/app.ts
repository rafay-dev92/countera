import "dotenv/config";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import path from "path";
import { exec } from "child_process";
import fs from "fs";
import replacementReminder from "./utils/replacementReminder";
import sendMail from "./utils/sendMail";
import userRouter from "./routes/User";
import permissionRouter from "./routes/Permission";
import businessRouter from "./routes/Business";
import customerRouter from "./routes/Customer";
import vehicleRouter from "./routes/Vehicle";
import productRouter from "./routes/Product";
import packageRouter from "./routes/Package";
import productCategoryRouter from "./routes/ProductCategory";
import taxRouter from "./routes/Tax";
import appointmentRouter from "./routes/Appointment";
import invoiceRouter from "./routes/Invoice";
import archivedInvoicesRouter from "./routes/ArchivedInvoices";
import quotationRouter from "./routes/Quotation";
import workOrderRouter from "./routes/WorkOrder";
import inspectionRouter from "./routes/Inspection";
import addressRouter from "./routes/Address";
import customerVehicleRouter from "./routes/CustomerVehicle";
import paymentRouter from "./routes/Payment";
import mailRouter from "./routes/Mail";
import salesRouter from "./routes/Sales";

const app = express();

app.set("trust proxy", true);

const productDir = path.join(import.meta.dirname, "uploads/products");
const businessDir = path.join(import.meta.dirname, "uploads/business");
// Check if uploads directory exists, and create it if it doesn't
if (!fs.existsSync(productDir)) {
  fs.mkdirSync(productDir, { recursive: true });
  console.log("Products images directory created");
}
if (!fs.existsSync(businessDir)) {
  fs.mkdirSync(businessDir, { recursive: true });
  console.log("Business images directory created");
} else {
  console.log("Images directory already exists");
}

const backupDir = path.join(import.meta.dirname, "backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log("Backups directory created");
}

// Schedule backup to run at 12 AM (midnight) every day
cron.schedule("0 0 * * *", () => {
  const now = new Date();
  console.log(`[${now.toISOString()}] Starting scheduled database backup...`);
  const backupScript = path.join(import.meta.dirname, "scripts", "backup.ts");

  exec(`node ${backupScript}`, (error, stdout, stderr) => {
    const endTime = new Date();
    if (error) {
      console.error(
        `[${endTime.toISOString()}] Backup failed: ${error.message}`
      );
      const errorMsg = `Backup failed: ${error.message}`;
      console.error(errorMsg);
      const logDir = path.join(import.meta.dirname, "logs");
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      fs.appendFileSync(
        path.join(logDir, "backup.log"),
        `[${endTime.toISOString()}] ` + errorMsg + '\n'
      );

      // Send email on failure
      const mailOptions = {
        from: `"Countera Backup" <${process.env.GMAIL_SMTP_EMAIL}>`,
        to: process.env.BACKUP_ALERT_EMAIL || process.env.GMAIL_SMTP_EMAIL,
        subject: 'Countera Backup Failed',
        text: errorMsg,
        html: `<p>${errorMsg}</p>`
      };
      sendMail(mailOptions);

      return;
    }
    if (stderr) {
      console.error(`[${endTime.toISOString()}] Backup stderr: ${stderr}`);
      return;
    }
    console.log(`[${endTime.toISOString()}] Backup completed successfully`);
    if (stdout) {
      console.log(`[${endTime.toISOString()}] Backup output: ${stdout}`);
    }
  });
});

// daily invoice's product replacement
cron.schedule('0 9 * * *', () => {
  replacementReminder()
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Production origins come from CORS_ORIGINS (comma-separated) in .env;
// localhost defaults keep local dev working without configuration.
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim()) : []),
  ],
};
app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.status(200);
  res.send("Hello from Countera API");
});
app.use(
  "/uploads/business",
  express.static(path.join(import.meta.dirname, "uploads/business"))
);
app.use(
  "/uploads/products",
  express.static(path.join(import.meta.dirname, "uploads/products"))
);
app.use("/api/user", userRouter);
app.use("/api/permission", permissionRouter);
app.use("/api/business", businessRouter);
app.use("/api/customer", customerRouter);
app.use("/api/vehicle", vehicleRouter);
app.use("/api/product", productRouter);
app.use("/api/package", packageRouter);
app.use("/api/productcategories", productCategoryRouter);
app.use("/api/tax", taxRouter);
app.use("/api/appointment", appointmentRouter);
app.use("/api/invoice", invoiceRouter);
app.use("/api/archived-invoice", archivedInvoicesRouter);
app.use("/api/quotation", quotationRouter);
app.use("/api/workorder", workOrderRouter);
app.use("/api/inspection", inspectionRouter);
app.use("/api/address", addressRouter);
app.use("/api/customervehicle", customerVehicleRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/mail", mailRouter);
app.use("/api/sales", salesRouter);

const port = Number(process.env.PORT) || 3000;
app.listen(port, (error?: unknown) => {
  if (!error)
    console.log(
      `Server is Successfully Running, and App is listening on http://localhost:${port}`
    );
  else console.log("Error occurred, server can't start", error);
});
