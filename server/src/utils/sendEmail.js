const { Resend } = require("resend");

const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  return new Resend(process.env.RESEND_API_KEY);
};

const sendDownAlert = async (email, url, name) => {
  const resend = getResendClient();

  if (!resend) {
    console.warn(`[Email] RESEND_API_KEY missing. Cannot send down alert to ${email}`);
    return;
  }

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `[ALERT] Monitor Down: ${name}`,
      text: `Your monitored URL "${name}" (${url}) is currently down.\n\nWe will notify you when it recovers.`,
    });
    console.log(`[Email] Sent down alert to ${email} for monitor ${url}`);
    return data;
  } catch (error) {
    console.error(`[Email] Error sending down alert to ${email}:`, error);
  }
};

const sendRecoveryAlert = async (email, url, name) => {
  const resend = getResendClient();

  if (!resend) {
    console.warn(
      `[Email] RESEND_API_KEY missing. Cannot send recovery alert to ${email}`,
    );
    return;
  }

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `[RESOLVED] Monitor Recovered: ${name}`,
      text: `Your monitored URL "${name}" (${url}) has recovered and is back up.`,
    });
    console.log(`[Email] Sent recovery alert to ${email} for monitor ${url}`);
    return data;
  } catch (error) {
    console.error(`[Email] Error sending recovery alert to ${email}:`, error);
  }
};

module.exports = {
  sendDownAlert,
  sendRecoveryAlert,
};
