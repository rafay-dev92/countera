const { User } = require("../models");
const UserRole = require("../utils/enums/userRoles");

function authorizePermission(requiredPermission) {
  return async (req, res, next) => {
    const user = req.user; // assumed to be set by your auth middleware
    const userData = await User.findOne({
      where: { id: user.id },
      attributes: ["id", "role"],
      include: ["Permission"],
    });

    if (!userData) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (userData.role === UserRole.SUPER_ADMIN) {
      return next(); // Super admin has all permissions
    }

    const hasPermission = userData.Permission.some(
      (perm) => perm.name === requiredPermission
    );

    if (!hasPermission) {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permission" });
    }

    next();
  };
}

module.exports = authorizePermission;
