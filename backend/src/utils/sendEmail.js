// utils/sendEmail.js
const nodemailer = require('nodemailer');

// Replace these with your actual SMTP credentials!
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'hanzalasarang01@gmail.com',
    pass: 'dlou gslc wgjo ucqt'
  }
});

exports.sendAccountEmail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: '"Mentversity" <no-reply@mentversity.com>',
    to,
    subject,
    html
  });
};
