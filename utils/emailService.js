import Sib from 'sib-api-v3-sdk';

const client = Sib.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const transEmailApi = new Sib.TransactionalEmailsApi();

const sendEmail = async (options) => {
  try {
    const sender = {
      email: process.env.BREVO_SENDER_EMAIL,
      name: process.env.BREVO_SENDER_NAME,
    };

    const receivers = [
      {
        email: options.email,
      },
    ];

    const emailData = {
      sender,
      to: receivers,
      subject: options.subject,
    };

    if (options.htmlContent) {
      emailData.htmlContent = options.htmlContent;
    } else if (options.textContent) {
      emailData.textContent = options.textContent;
    } else {
      throw new Error('Email content is missing.');
    }

    await transEmailApi.sendTransacEmail(emailData);

    console.log(`Email sent to ${options.email} successfully!`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email. Please try again later.');
  }
};

export default sendEmail;