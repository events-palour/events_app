import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { InviteEmail } from '@/lib/email/invitation';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function sendInviteEmail({
  inviteToken,
  toEmail,
  organizationName,
  organizationLogo,
  senderName,
  senderEmail,
}: {
  inviteToken: string;
  toEmail: string;
  organizationName: string;
  organizationLogo?: string | null;
  senderName: string;
  senderEmail: string;
}) {
  const inviteUrl = `${process.env.BASE_URL}/invite/${inviteToken}`;

  const emailHtml = await render(
    InviteEmail({
      userName: toEmail,
      senderName,
      senderEmail,
      organizationName,
      organizationLogo: organizationLogo || undefined,
      inviteUrl,
    })
  );

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `Join ${organizationName} on Events Palour`,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending invite email:', error);
    throw new Error('Failed to send invite email');
  }
}