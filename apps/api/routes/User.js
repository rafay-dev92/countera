const express = require("express");
const router = express.Router();
const { User, Permission, Business } = require("../models");
const { body, validationResult } = require("express-validator");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fetchUser = require("../middlewares/fetchUser");
const { Op } = require("sequelize");
const { UserRole } = require("@invoicify/shared");
require("dotenv").config();

router.get("/", fetchUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const loggedInUser = await User.findOne({
      where: {
        id: userId,
        role: { [Op.ne]: UserRole.SUPER_ADMIN },
        BusinessId: { [Op.ne]: null },
      },
    });

    if (loggedInUser) {
      const user = await User.findAll({
        where: { BusinessId: loggedInUser.dataValues.BusinessId },
        include: ["Permission", "Business"],
      });
      return res.json(user);
    }
    const user = await User.findAll({
      include: ["Permission", "Business"],
      order: [
        [Business, "name", "ASC"],
        ["createdAt", "ASC"],
      ],
    });
    return res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", fetchUser, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: ["Permission"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post(
  "/signup",
  [
    body("user.email", "Enter a valid email").isEmail(),
    body(
      "user.password",
      "Password must be atleast 5 characters long"
    ).isLength({ min: 5 }),
  ],
  fetchUser,
  async (req, res) => {
    //Checking whether request is normal
    const errors = validationResult(req);

    if (!errors.isEmpty())
      return res
        .status(400)
        .json({ message: `User not created. ${errors.errors[0]?.msg}` });

    try {
      const userData = req.body.user;

      if (userData.role !== UserRole.SUPER_ADMIN && !userData.BusinessId) {
        return res.status(400).json({ message: "BusinessId is required" });
      }

      if (req.body.permissions && req.body.permissions.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one permission is required" });
      }

      const existingUser = await User.findOne({
        where: {
          email: userData.email,
          BusinessId: userData.BusinessId,
        },
      });

      if (existingUser) {
        res.status(409).json({ message: "User already exist" });
      } else {
        const salt = await bcryptjs.genSalt(10);
        const secPass = await bcryptjs.hash(userData.password, salt);

        const newUser = await User.create({
          ...userData,
          password: secPass,
        });

        await newUser.setPermission(req.body.permissions);

        res.status(200).json({ message: "User created successfully" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
);

router.post("/add_permission", async (req, res) => {
  try {
    const user = await User.findByPk(req.body.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (req.body.permission.length !== 0) {
      await Promise.all(
        req.body.permissions.map(async (item) => {
          const permission = await Permission.findByPk(item);
          await user.addPermission(permission);
        })
      );
    }

    res.json({ message: "permissions added to user successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, businessId } = req.body;
    const whereClause = { email };
    if (businessId) whereClause.BusinessId = businessId;

    const user = await User.findOne({ where: whereClause });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passMatch = await bcryptjs.compare(password, user.password);

    if (!passMatch) {
      return res
        .status(401)
        .json({ message: "Please provide correct credentials" });
    }

    const data = {
      user: {
        id: user.id,
      },
    };

    const token = jwt.sign(data, process.env.JWT_SECRET, {
      expiresIn: 0.5 * 60 * 60,
    });

    const refreshToken = jwt.sign(data, process.env.JWT_SECRET, {
      expiresIn: 7 * 24 * 60 * 60, // 7 days
    });

    res.send({
      token: token,
      refreshToken: refreshToken,
      sessionExpire: Date.now() + 0.5 * 60 * 60 * 1000
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error login user" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.header("refresh-token");
    const token = req.header("auth-token");

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is required" });
    }

    if (!token) {
      return res.status(401).json({ message: "Auth token is required" });
    }

    // Verify refresh token
    let refreshTokenData;
    try {
      refreshTokenData = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    // Optionally verify the old token (it might be expired, which is fine)
    let oldTokenData;
    try {
      oldTokenData = jwt.verify(token, process.env.JWT_SECRET);
      if (oldTokenData.user.id !== refreshTokenData.user.id) {
        return res.status(401).json({ message: "Token mismatch" });
      }
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Generate new access token
    const data = {
      user: {
        id: refreshTokenData.user.id,
      },
    };

    const newToken = jwt.sign(data, process.env.JWT_SECRET, {
      expiresIn: 0.5 * 60 * 60,
    });

    res.send({
      token: newToken,
      refreshToken: refreshToken,
      sessionExpire: Date.now() + 0.5 * 60 * 60 * 1000
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error refreshing token" });
  }
});

router.post("/businesses-for-email", async (req, res) => {
  try {
    const { email, captcha } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!captcha) {
      return res.status(400).json({ success: false, message: "Captcha is required" });
    }

    // Verify captcha
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captcha}`;
    const response = await fetch(verifyUrl, { method: "POST" });
    const captchaData = await response.json();

    if (!captchaData.success) {
      return res.status(400).json({
        success: false,
        message: "Captcha verification failed",
      });
    }

    const users = await User.findAll({
      where: { email },
      include: {
        model: Business,
        as: "Business",
        attributes: ["id", "name"],
      },
    });

    if (users.length > 0 && users[0].role === UserRole.SUPER_ADMIN) {
      return res.json({ isSuperAdmin: true });
    }

    const businesses = users.map((user) => user.Business).filter(Boolean);
    res.json({ businesses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching businesses for email" });
  }
});

router.post("/getuser", fetchUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findOne({
      where: { id: userId },
      attributes: { exclude: ["password"] },
      include: ["Permission", "Business"],
    });

    res.send(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

router.put("/update/:id", fetchUser, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: ["Permission"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.body.user.password) {
      const salt = await bcryptjs.genSalt(10);
      const secPass = await bcryptjs.hash(req.body.user.password, salt);
      req.body.user.password = secPass;
    } else {
      req.body.user.password = user.password;
    }
    await user.update(req.body.user);

    const deletedItems = user.Permission.filter(
      (orgPerm) =>
        !req.body.permissions.some((item) => item === orgPerm.dataValues.id)
    ).map((changeItem) => changeItem.dataValues.id);

    const addItems = req.body.permissions.filter(
      (perm) => !user.Permission.some((item) => item.dataValues.id === perm)
    );

    if (addItems.length !== 0) {
      await Promise.all(
        addItems.map(async (item) => {
          const permission = await Permission.findByPk(item);
          await user.addPermission(permission);
        })
      );
    }

    if (deletedItems.length !== 0) {
      await Promise.all(
        deletedItems.map(async (item) => {
          const permission = await Permission.findByPk(item);
          await user.removePermission(permission);
        })
      );
    }

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating user" });
  }
});

router.delete("/delete/:id", fetchUser, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.destroy();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting user" });
  }
});

router.delete("/delete_permission", async (req, res) => {
  try {
    const user = await User.findByPk(req.body.userId);
    const permission = await Permission.findByPk(req.body.permissionId);

    user.removePermission(permission);
    res.json({ message: "permission removed from user successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error removing permission from user" });
  }
});

module.exports = router;
