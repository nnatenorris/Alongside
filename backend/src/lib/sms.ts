import twilio from 'twilio';

export async function sendShareSms(
  phone: string,
  shareLink: string,
): Promise<void> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } =
    process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    console.log(`[dev] would SMS ${phone}: ${shareLink}`);
    return;
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  await client.messages.create({
    to: phone,
    from: TWILIO_FROM_NUMBER,
    body: `You got a clip — ${shareLink}`,
  });
}
