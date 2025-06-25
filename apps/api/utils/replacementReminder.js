const { Invoice, Product, Customer, Business } = require("../models");
const { Op } = require("sequelize");
const sendEmail = require("./sendMail");

const replacementReminder = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const invoices = await Invoice.findAll({
            include: [
                {
                    model: Product,
                    as: 'Product',
                    where: {
                        '$Product.invoice_product.replacement_reminder_date$': {
                            [Op.gte]: today,
                            [Op.lt]: tomorrow,
                        },
                    },
                },
                {
                    model: Customer,
                    as: 'Customer',
                    include: [
                        {
                            model: Business,
                            as: 'Business'
                        }
                    ]
                },
            ],
        });

        for (const invoice of invoices) {
            for (const product of invoice.Product) {
                const reminderDate = new Date(product.invoice_product.replacement_reminder_date);
                reminderDate.setHours(0, 0, 0, 0);
                
                if (reminderDate.getTime() === today.getTime()) {
                    const customer = invoice.Customer;
                    const business = invoice.Customer.Business;
                    const emailData = {
                        from: `"${business.name}" <rafaywork93@gmail.com>`,
                        to: customer.email,
                        replyTo: business.email,
                        subject: `Replacement Reminder for ${product.name}`,
                        html: `
                            <p>Dear ${customer.firstName},</p>
                            <p>This is a reminder to replace your product: <strong>${product.name}</strong>.</p>
                            <p>If you have any questions, please contact us at ${business.email} or ${business.tel}.</p>
                            <p>Thank you,</p>
                            <p>${business.name}</p>
                        `
                    };
                    await sendEmail(emailData);
                }
            }
        }
    } catch (error) {
        console.error("Error sending replacement reminders:", error);
    }
};

module.exports = replacementReminder;