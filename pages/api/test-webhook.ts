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

  console.log('=== TEST WEBHOOK API ENDPOINT ===');
  console.log('Date/Time:', new Date().toISOString());
  
  // Log environment variables for debugging
  console.log('Environment check:');
  console.log('- BREVO_API_KEY exists:', Boolean(process.env.BREVO_API_KEY));
  const apiKey = process.env.BREVO_API_KEY || '';
  if (apiKey) console.log('- BREVO_API_KEY prefix:', apiKey.substring(0, 10) + '...');
  console.log('- BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL || 'Not set');
  console.log('- BREVO_SENDER_NAME:', process.env.BREVO_SENDER_NAME || 'Not set');
  console.log('- NODE_ENV:', process.env.NODE_ENV);

  try {
    // Use the provided email or a default test email
    const email = req.body.email || 'max.plasse@viennou.com';
    const name = req.body.name || 'Test User';
    const membershipType = req.body.membershipType || 'digital';

    console.log(`Sending test confirmation email to ${email} (${name}) with type ${membershipType}`);

    // Attempt to send a test membership confirmation email
    const emailResult = await sendMembershipConfirmationEmail(
      email,
      name,
      membershipType
    );

    if (emailResult.success) {
      console.log(`✅ Confirmation email sent to ${email}`);
      console.log('Email result:', JSON.stringify(emailResult.data || {}, null, 2));
      
      return res.status(200).json({
        success: true,
        message: `Test webhook email sent to ${email}`,
        data: emailResult.data
      });
    } else {
      console.error('❌ Failed to send confirmation email:', emailResult.error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send test webhook email',
        error: emailResult.error?.message || 'Unknown error'
      });
    }
  } catch (error: any) {
    console.error('❌ Error in test webhook endpoint:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred in the test webhook endpoint',
      error: error.message
    });
  }
} 