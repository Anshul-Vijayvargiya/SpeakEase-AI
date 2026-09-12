import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

if (!resend) {
  console.warn('⚠️ RESEND_API_KEY not set — password reset emails will not be sent.');
}

export default resend;
