const express = require("express");
const cors = require("cors");
const cron = require('node-cron');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const fs = require("fs");

const productDir = path.join(__dirname, "uploads/products");
const businessDir = path.join(__dirname, "uploads/business");
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

// Create backups directory if it doesn't exist
const backupDir = path.join(__dirname, "backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log("Backups directory created");
}

// Schedule backup to run at 12 AM (midnight) every day
cron.schedule('0 0 * * *', () => {
  const now = new Date();
  console.log(`[${now.toISOString()}] Starting scheduled database backup...`);
  const backupScript = path.join(__dirname, 'scripts', 'backup.js');
  
  exec(`node ${backupScript}`, (error, stdout, stderr) => {
    const endTime = new Date();
    if (error) {
      console.error(`[${endTime.toISOString()}] Backup failed: ${error.message}`);
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

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const corsOptions = {
  origin: ['http://localhost:5173', 'https://sales4x-fe.vercel.app'],
};
app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.status(200);
  res.send("Home");
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/user", require("./routes/User"));
app.use("/api/permission", require("./routes/Permission"));
app.use("/api/business", require("./routes/Business"));
app.use("/api/customer", require("./routes/Customer"));
app.use("/api/vehicle", require("./routes/Vehicle"));
app.use("/api/product", require("./routes/Product"));
app.use("/api/package", require("./routes/Package"));
app.use("/api/productcategories", require("./routes/ProductCategory"));
app.use("/api/tax", require("./routes/Tax"));
app.use("/api/appointment", require("./routes/Appointment"));
app.use("/api/invoice", require("./routes/Invoice"));
app.use("/api/quotation", require("./routes/Quotation"));
app.use("/api/workorder", require("./routes/WorkOrder"));
app.use("/api/inspection", require("./routes/Inspection"));
app.use("/api/address", require("./routes/Address"));
app.use("/api/customervehicle", require("./routes/CustomerVehicle"));
app.use("/api/payment", require("./routes/Payment"));
app.use("/api/mail", require("./routes/Mail"));

app.listen(5000, (error) => {
  if (!error)
    console.log(
      `Server is Successfully Running, and App is listening on http://localhost:${5000}`
    );
  else console.log("Error occurred, server can't start", error);
});