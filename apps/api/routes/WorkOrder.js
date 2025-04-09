const express = require("express");
const router = express.Router();
const {
  WorkOrder,
  Product,
  workorder_product,
  User,
  Customer,
  CustomerVehicle,
  Business,
} = require("../models");
const fetchUser = require("../middlewares/fetchUser");
const { Op } = require("sequelize");
require("dotenv").config();

router.get("/", fetchUser, async (req, res) => {
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
      const workorders = await WorkOrder.findAll({
        where: { BusinessId: user.dataValues.BusinessId },
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: Customer,
            as: "Customer",
            include: ["Address", "Vehicle"],
          },
          {
            model: CustomerVehicle,
            as: "CustomerVehicle",
          },
          {
            model: Product,
            as: "Product",
            through: "workorder_product",
            include: ["Tax"],
          },
          {
            model: Business,
            as: "Business",
          },
        ],
      });
      return res.json(workorders);
    }

    const workorders = await WorkOrder.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Customer,
          as: "Customer",
          include: ["Address", "Vehicle"],
        },
        {
          model: CustomerVehicle,
          as: "CustomerVehicle",
        },
        {
          model: Product,
          as: "Product",
          through: "workorder_product",
          include: ["Tax"],
        },
        {
          model: Business,
          as: "Business",
        },
      ],
    });

    return res.json(workorders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", fetchUser, async (req, res) => {
  try {
    const workorder = await WorkOrder.findByPk(req.params.id, {
      include: [
        {
          model: Customer,
          as: "Customer",
          include: ["Address", "Vehicle"],
        },
        {
          model: CustomerVehicle,
          as: "CustomerVehicle",
        },
        {
          model: Product,
          as: "Product",
          through: "workorder_product",
          include: ["Tax"],
        },
        {
          model: Business,
          as: "Business",
        },
      ],
    });

    if (!workorder) {
      return res.status(404).json({ message: "workorder not found" });
    }

    res.json(workorder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/create", fetchUser, async (req, res) => {
  try {
    const workOrderData = req.body.workorderData;
    if (!("CustomerId" in workOrderData)) {
      return res.status(409).json({ message: "Customer Id is mandatory" });
    }

    const newWorkOrder = await WorkOrder.create(workOrderData);
    if (req.body.products.length !== 0) {
      await Promise.all(
        req.body.products.map(async (item) => {
          const product = await Product.findByPk(item.split(":")[0]);
          await newWorkOrder.addProduct(product, {
            through: { quantity: item.split(":")[1] },
          });
        })
      );
    }

    const currentWorkOrder = await WorkOrder.findByPk(newWorkOrder.id, {
      include: [
        {
          model: Customer,
          as: "Customer",
          include: ["Address", "Vehicle"],
        },
        {
          model: CustomerVehicle,
          as: "CustomerVehicle",
        },
        {
          model: Product,
          as: "Product",
          through: "workorder_product",
          include: ["Tax"],
        },
        {
          model: Business,
          as: "Business",
        },
      ],
    });

    return res.status(200).json({
      message: "WorkOrder created successfully",
      data: currentWorkOrder,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/update/:id", fetchUser, async (req, res) => {
  try {
    const workorder = await WorkOrder.findByPk(req.params.id, {
      include: ["Product"],
    });

    if (!workorder) {
      return res.status(404).json({ message: "WorkOrder not found" });
    }

    if (req.body?.products && req.body?.products.length > 0) {
      try {
        req.body.products.forEach(async (newProduct) => {
          const productId = newProduct.split(":")[0];
          const newQuantity = newProduct.split(":")[1];

          // Check if the product exists in the current products
          const existingProduct = workorder.Product.find(
            (currentProduct) => currentProduct.dataValues.id === productId
          );

          if (existingProduct) {
            // If the product exists, update the quantity in the junction table
            const res = await workorder_product.update(
              { quantity: newQuantity },
              {
                where: {
                  WorkOrderId: workorder.id,
                  ProductId: productId,
                },
              }
            );
          } else {
            // If the product doesn't exist, add a new entry to the junction table
            const res = await workorder_product.create({
              WorkOrderId: workorder.id,
              ProductId: productId,
              quantity: newQuantity,
            });
          }
        });
      } catch (error) {
        return res.status(500).json({ message: "Internel Server Error" });
      }

      const deletedItems = workorder.Product.filter(
        (orgProd) =>
          !req.body.products.some(
            (item) => item.split(":")[0] === orgProd.dataValues.id
          )
      ).map((changeItem) => changeItem.dataValues.id);

      if (deletedItems.length !== 0) {
        await Promise.all(
          deletedItems.map(async (item) => {
            const product = await Product.findByPk(item.split(":")[0]);
            await workorder.removeProduct(product);
          })
        );
      }
    }

    await workorder.update(req.body.workOrderData);

    const currentWorkOrder = await WorkOrder.findByPk(workorder.id, {
      include: [
        {
          model: Customer,
          as: "Customer",
          include: ["Address", "Vehicle"],
        },
        {
          model: CustomerVehicle,
          as: "CustomerVehicle",
        },
        {
          model: Product,
          as: "Product",
          through: "workorder_product",
          include: ["Tax"],
        },
        {
          model: Business,
          as: "Business",
        },
      ],
    });

    return res.status(200).json({
      message: "WorkOrder updated successfully",
      data: currentWorkOrder,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete/:id", fetchUser, async (req, res) => {
  try {
    const workorder = await WorkOrder.findByPk(req.params.id);

    if (!workorder) {
      return res.status(404).json({ message: "workorder not found" });
    }

    await workorder.destroy();

    res.json({ message: "WorkOrder deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting workorder" });
  }
});

module.exports = router;
