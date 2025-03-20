import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import { sendMembershipConfirmationEmail } from '../../utils/email';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }
  
  console.log('🔍 WEBHOOK DEBUG ENDPOINT TRIGGERED!');
  console.log('Timestamp:', new Date().toISOString());
  
  // Log all environment variables for debugging (without exposing full sensitive values)
  console.log('\n=== ENVIRONMENT VARIABLES CHECK ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  console.log('BREVO_API_KEY exists:', Boolean(process.env.BREVO_API_KEY));
  if (process.env.BREVO_API_KEY) {
    console.log('BREVO_API_KEY starts with:', process.env.BREVO_API_KEY.substring(0, 5) + '...');
    console.log('BREVO_API_KEY length:', process.env.BREVO_API_KEY.length);
  }
  
  console.log('BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL || 'NOT SET');
  console.log('BREVO_SENDER_NAME:', process.env.BREVO_SENDER_NAME || 'NOT SET');
  console.log('DEBUG_WEBHOOK:', process.env.DEBUG_WEBHOOK);
  console.log('VERBOSE_DEBUG:', process.env.VERBOSE_DEBUG);
  
  console.log('STRIPE_SECRET_KEY exists:', Boolean(process.env.STRIPE_SECRET_KEY));
  console.log('STRIPE_WEBHOOK_SECRET exists:', Boolean(process.env.STRIPE_WEBHOOK_SECRET));
  console.log('STRIPE_CLI_WEBHOOK_SECRET exists:', Boolean(process.env.STRIPE_CLI_WEBHOOK_SECRET));
  
  try {
    const rawBody = await buffer(req);
    
    try {
      const payload = JSON.parse(rawBody.toString());
      console.log('Request payload type:', payload.type);
      
      // Only process checkout.session.completed events
      if (payload.type === 'checkout.session.completed') {
        const session = payload.data.object;
        
        // Extract customer email from session
        const customerEmail = 
          session.customer_details?.email ||
          session.customer_email ||
          (session.customer && typeof session.customer === 'object' && 'email' in session.customer ? 
            (session.customer as any).email : null) ||
          (session.payment_intent && typeof session.payment_intent === 'object' ? 
            (session.payment_intent as any).receipt_email : null) ||
          session.metadata?.email ||
          'm20plasse@gmail.com'; // Fallback for testing
        
        const customerName = session.customer_details?.name || 'Test User';
        const membershipType = session.metadata?.membershipType || 'digital';
        
        console.log(`\n=== EXTRACTED CUSTOMER DATA ===`);
        console.log('Email:', customerEmail);
        console.log('Name:', customerName);
        console.log('Membership Type:', membershipType);
        
        // Try direct email sending to verify Brevo integration
        console.log('\n=== TESTING EMAIL SENDING ===');
        
        try {
          // Send test email first
          console.log('Sending direct test email using Brevo SDK...');
          const SibApiV3Sdk = require('sib-api-v3-sdk');
          const defaultClient = SibApiV3Sdk.ApiClient.instance;
          const apiKey = defaultClient.authentications['api-key'];
          apiKey.apiKey = process.env.BREVO_API_KEY;
          const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
          
          // Create sender
          const sender = {
            email: process.env.BREVO_SENDER_EMAIL || 'solene.legendre@polyarthrite-andar.com',
            name: process.env.BREVO_SENDER_NAME || 'ANDAR'
          };
          
          // Create a direct email
          const testEmail = new SibApiV3Sdk.SendSmtpEmail();
          testEmail.to = [{
            email: customerEmail,
            name: customerName
          }];
          testEmail.subject = 'ANDAR - Test direct email from webhook';
          testEmail.htmlContent = `
            <html>
              <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h1>Webhook Debug Test</h1>
                <p>This is a test email sent directly using the Brevo SDK from the webhook debug endpoint.</p>
                <p>Timestamp: ${new Date().toISOString()}</p>
              </body>
            </html>
          `;
          testEmail.sender = sender;
          
          // Send direct email
          console.log('Sending direct email to:', customerEmail);
          const directResult = await apiInstance.sendTransacEmail(testEmail);
          console.log('✅ DIRECT EMAIL SENT SUCCESSFULLY!');
          console.log('Direct Message ID:', directResult.messageId);
          
          // Now try sending via the utility function
          console.log('\nNow trying to send via utility function...');
          const templateResult = await sendMembershipConfirmationEmail(
            customerEmail,
            customerName,
            membershipType
          );
          
          if (templateResult.success) {
            console.log('✅ TEMPLATE EMAIL SENT SUCCESSFULLY!');
            console.log('Template Message ID:', templateResult.data.messageId);
          } else {
            console.error('❌ Failed to send template email:', templateResult.error);
          }
          
          // Return success
          return res.status(200).json({
            received: true, 
            directEmailSent: true,
            directMessageId: directResult.messageId,
            templateEmailSent: templateResult.success,
            templateMessageId: templateResult.success ? templateResult.data.messageId : null
          });
        } catch (emailError: any) {
          console.error('❌ Error sending email in debug endpoint:', emailError.message);
          if (emailError.response) {
            console.error('Error status:', emailError.response.status);
            console.error('Error details:', emailError.response.text);
          }
          
          return res.status(500).json({
            received: true,
            error: 'Failed to send email',
            errorMessage: emailError.message,
            errorDetails: emailError.response ? emailError.response.text : null
          });
        }
      } else {
        console.log(`Ignoring event type: ${payload.type}`);
        return res.status(200).json({ received: true, ignored: true });
      }
    } catch (parseError) {
      console.error('Error parsing webhook payload:', parseError);
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }
  } catch (err: any) {
    console.error(`Error in webhook debug endpoint: ${err.message}`);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ error: err.message });
  }
} 