const nodeMailer = require('nodemailer');

const sendEmail = async (options) => {

  try {
    const transporter = nodeMailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure:true,
      auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD
      },
    
  });
  
    await transporter.sendMail({
      from: "Shobhit Choudhary <shobhitchoudhary745@gmail.com>",
      to: options.email,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (error) {
     return false;
  }

};

module.exports = sendEmail;