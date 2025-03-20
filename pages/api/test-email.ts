import { NextApiRequest, NextApiResponse } from 'next';
import { sendMembershipConfirmationEmail } from '../../utils/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // This endpoint should only be available in development mode
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // Log environment variables for debugging
  console.log('Test Email API - Environment check:');
  console.log('- BREVO_API_KEY exists:', Boolean(process.env.BREVO_API_KEY));
  console.log('- BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL || 'Not set');
  console.log('- BREVO_SENDER_NAME:', process.env.BREVO_SENDER_NAME || 'Not set');

  try {
    const { email, name, membershipType } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log(`Sending test email to ${email} (${name || 'No name'}) with type ${membershipType || 'digital'}`);

    // Send a test confirmation email
    const result = await sendMembershipConfirmationEmail(
      email,
      name || 'Test User',
      membershipType || 'digital'
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Test email sent to ${email}`,
        data: result.data
      });
    } else {
      console.error('Failed to send test email:', result.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error?.message || 'Unknown error'
      });
    }
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while sending the test email',
      error: error.message
    });
  }
} 