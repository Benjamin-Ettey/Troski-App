const { Resend } = require("resend");

const sendEmail = async ({ to, subject, html }) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { data, error } = await resend.emails.send({
      from: "Troski System <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });
    if (error) {
      return console.error({ error });
    } else {
      console.log(data);
    }
  } catch (error) {
    console.error(error);
  }
};

module.exports = { sendEmail };
