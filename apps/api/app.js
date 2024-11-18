const express = require("express");
const cors = require("cors");
const app = express();
const fs = require('fs');

const path = require("path");

const uploadsDir = path.join(__dirname, "uploads");
// Check if uploads directory exists, and create it if it doesn't
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Uploads directory created");
} else {
  console.log("Uploads directory already exists");
}

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));

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
app.use("/api/tax", require("./routes/Tax"));
app.use("/api/appointment", require("./routes/Appointment"));
app.use("/api/invoice", require("./routes/Invoice"));
app.use("/api/quotation", require("./routes/Quotation"));
app.use("/api/workorder", require("./routes/WorkOrder"));
app.use("/api/address", require("./routes/Address"));

app.listen(5000, (error) => {
  if (!error)
    console.log(
      `Server is Successfully Running, and App is listening on http://localhost:${5000}`
    );
  else console.log("Error occurred, server can't start", error);
});
