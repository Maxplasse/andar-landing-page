import { NextApiRequest, NextApiResponse } from 'next';
import { sendMembershipConfirmationEmail } from '../../utils/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { email, name, membershipType } = req.body;

    if (!email || !name || !membershipType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`[${new Date().toISOString()}] ====== TEST CHECKOUT EMAIL ======`);
    console.log(`[${new Date().toISOString()}] Email: ${email}`);
    console.log(`[${new Date().toISOString()}] Name: ${name}`);
    console.log(`[${new Date().toISOString()}] Membership Type: ${membershipType}`);

    // Send the membership confirmation email
    const emailResult = await sendMembershipConfirmationEmail(
      email,
      name,
      membershipType
    );

    if (emailResult.success) {
      console.log(`[${new Date().toISOString()}] ✅ EMAIL SENT SUCCESSFULLY! Message ID: ${emailResult.data?.messageId}`);
      return res.status(200).json({
        success: true,
        message: `Confirmation email sent to ${email}`,
        data: emailResult.data
      });
    } else {
      console.error(`[${new Date().toISOString()}] ❌ FAILED TO SEND EMAIL:`, emailResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send confirmation email',
        error: emailResult.error
      });
    }
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error:`, error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred',
      error: error.message
    });
  }
} 