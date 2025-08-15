function getDefaultPackages() {
  return [
    {
      name: "Tire balance",
      description: "",
      products: ["Tire Mount + Balance:1"],
    },
    {
      name: "Patch",
      description: "",
      products: ["Patch:1"],
    },
    {
      name: "Plug",
      description: "",
      products: ["Plug:1"],
    },
    {
      name: "Used Tire 65",
      description: "Used Tire 65 PKG",
      products: ["Used Tire Labor 25:1", "Used Tire 30:1"],
    },
    {
      name: "Used Tire 55",
      description: "Used Tire 55 PKG",
      products: ["Used Tire 20:1", "Used Tire Labor 25:1"],
    },
    {
      name: "Regular Oil Change 79.99",
      description: "5Q Motor OIL Regular Oil",
      products: ["Oil Change Labor:1", "Oil Filter Standard:1", "Oil Reg:5"],
    },
    {
      name: "Oil Sync 89.99",
      description: "5Q Motor OIL FULL SYNTHETIC",
      products: ["Oil Filter Standard:1", "Oil Change Labor:1", "Oil Sync:5"],
    },
    {
      name: "Alignment Front Wheel",
      description: "",
      products: ["FRONT END ALIGNMENT:1"],
    },
    {
      name: "Alignment All Wheel",
      description: "",
      products: ["FOUR WHEEL ALIGNMENT:1"],
    },
  ];
}

module.exports = getDefaultPackages;
