// Notification service: every call always records an in-app notification.
// Real email/SMS/WhatsApp sending only happens if the relevant env vars are
// set - otherwise it logs to the console so you can see exactly what would
// have been sent. This means the app is fully demoable with zero credentials.
import * as repo from "../db/repo.js";

let mailer = null;
async function getMailer() {
  if (mailer) return mailer;
  if (!process.env.SMTP_HOST) return null;
  const nodemailer = await import("nodemailer");
  mailer = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return mailer;
}

let twilioClient = null;
async function getTwilio() {
  if (twilioClient) return twilioClient;
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;
  const twilio = await import("twilio");
  twilioClient = twilio.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return twilioClient;
}

async function sendEmail(to, subject, body) {
  const transport = await getMailer().catch(() => null);
  if (!transport) {
    console.log(`[email:dev-mode] to=${to} subject="${subject}" body="${body}"`);
    return;
  }
  await transport.sendMail({ from: process.env.SMTP_FROM, to, subject, text: body });
}

async function sendSMS(to, body) {
  const client = await getTwilio().catch(() => null);
  if (!client || !process.env.TWILIO_FROM_NUMBER) {
    console.log(`[sms:dev-mode] to=${to} body="${body}"`);
    return;
  }
  await client.messages.create({ from: process.env.TWILIO_FROM_NUMBER, to, body });
}

async function sendWhatsApp(to, body) {
  const client = await getTwilio().catch(() => null);
  if (!client || !process.env.TWILIO_WHATSAPP_FROM) {
    console.log(`[whatsapp:dev-mode] to=${to} body="${body}"`);
    return;
  }
  await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:${to}`,
    body,
  });
}

// The one function the rest of the app calls. `event` drives the copy;
// channels fire in parallel and never throw into the caller.
export async function notify({ userId, email, phone, event, data }) {
  const { title, body } = renderCopy(event, data);

  await repo.addNotification(userId, { type: event, title, body });

  const jobs = [];
  if (email) jobs.push(sendEmail(email, title, body));
  if (phone) jobs.push(sendSMS(phone, body));
  if (phone) jobs.push(sendWhatsApp(phone, body));

  await Promise.allSettled(jobs);
}

function renderCopy(event, data = {}) {
  switch (event) {
    case "booking_confirmed":
      return {
        title: "Booking confirmed",
        body: `Your ${data.testName} at ${data.providerName} is confirmed for ${data.slot?.date} at ${data.slot?.time}.`,
      };
    case "booking_cancelled":
      return { title: "Booking cancelled", body: `Your ${data.testName} at ${data.providerName} has been cancelled.` };
    case "report_ready":
      return { title: "Report ready", body: `Your report for ${data.testName} is ready to view in MediFinder.` };
    case "collection_status":
      return { title: "Sample collection update", body: `Your home collection for ${data.testName} is now: ${data.status.replace("_", " ")}.` };
    case "technician_assigned":
      return { title: "Technician assigned", body: `${data.technicianName} will visit for your ${data.testName} sample collection.` };
    default:
      return { title: "MediFinder update", body: data.body || "You have an update." };
  }
}
