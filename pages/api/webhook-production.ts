import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import SibApiV3Sdk from 'sib-api-v3-sdk';

// Disable body parser, we need the raw body for Stripe signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Define types for response
interface EmailResult {
  success: boolean;
  data?: any;
  error?: any;
  messageId?: string;
}

// Select appropriate Stripe keys based on environment
function getStripeKeys(): { secretKey: string | undefined; webhookSecret: string | undefined } {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.DEBUG_WEBHOOK === 'true'
    ? process.env.STRIPE_CLI_WEBHOOK_SECRET
    : process.env.STRIPE_WEBHOOK_SECRET;
    
  return { secretKey, webhookSecret };
}

// Initialize Brevo API client with error handling
function initializeBrevoClient(): SibApiV3Sdk.TransactionalEmailsApi {
  try {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY || '';
    return new SibApiV3Sdk.TransactionalEmailsApi();
  } catch (error: any) {
    console.error('Error initializing Brevo API client:', error);
    throw error;
  }
}

// Send confirmation email with retry logic
async function sendConfirmationEmailWithRetry(
  email: string, 
  name: string, 
  membershipType: string, 
  maxRetries = 3
): Promise<EmailResult> {
  const apiInstance = initializeBrevoClient();
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Attempt ${attempt} - Sending email to ${email}`);
      
      // Create sender info
      const sender = {
        email: process.env.BREVO_SENDER_EMAIL || 'solene.legendre@polyarthrite-andar.com',
        name: process.env.BREVO_SENDER_NAME || 'ANDAR'
      };
      
      // Get membership details
      const membershipDetails = getMembershipDetails(membershipType);
      
      // Create email with template
      const templateEmail = new SibApiV3Sdk.SendSmtpEmail();
      templateEmail.to = [{
        email: email,
        name: name
      }];
      
      templateEmail.templateId = 7;
      templateEmail.params = {
        name: name,
        membershipType: membershipType,
        date: new Date().toLocaleDateString('fr-FR'),
        membershipDetails: membershipDetails
      };
      templateEmail.sender = sender;
      
      // Send the email
      const response = await apiInstance.sendTransacEmail(templateEmail);
      
      console.log(`✅ Email sent successfully on attempt ${attempt}!`);
      console.log('Message ID:', response.messageId);
      return { success: true, data: response, messageId: response.messageId };
    } catch (error: any) {
      console.error(`❌ Attempt ${attempt} failed:`, error);
      
      // Log detailed error information
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error details:', error.response.text || JSON.stringify(error.response.data));
      }
      
      // Only retry if we haven't reached the max attempts
      if (attempt === maxRetries) {
        return { success: false, error };
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 500;
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { success: false, error: 'Max retries reached' };
}

// Extract customer email from session with robust fallbacks
async function extractCustomerEmail(session: any, stripe: Stripe): Promise<string | null> {
  console.log('Extracting customer email from session data...');
  
  // Try all the possible locations directly in the session
  let customerEmail: string | null = null;
  
  // Check customer_details first (most common location)
  if (session.customer_details && session.customer_details.email) {
    console.log('Found customer email in customer_details:', session.customer_details.email);
    customerEmail = session.customer_details.email;
  }
  // Then check customer_email (another common location)
  else if (session.customer_email) {
    console.log('Found customer email in customer_email:', session.customer_email);
    customerEmail = session.customer_email;
  }
  // Check receipt_email if available (need to use 'in' operator for TypeScript)
  else if ('receipt_email' in session && session.receipt_email) {
    console.log('Found customer email in receipt_email:', session.receipt_email);
    customerEmail = session.receipt_email;
  }
  // Check metadata (sometimes custom implementations put it here)
  else if (session.metadata && session.metadata.email) {
    console.log('Found customer email in metadata:', session.metadata.email);
    customerEmail = session.metadata.email;
  }
  // Check if customer is an object with email
  else if (session.customer && typeof session.customer === 'object' && 'email' in session.customer) {
    console.log('Found customer email in customer object:', session.customer.email);
    customerEmail = session.customer.email;
  }
  // If payment_intent is expanded and has receipt_email
  else if (
    session.payment_intent && 
    typeof session.payment_intent === 'object' && 
    'receipt_email' in session.payment_intent &&
    session.payment_intent.receipt_email
  ) {
    console.log('Found receipt_email in payment_intent:', session.payment_intent.receipt_email);
    customerEmail = session.payment_intent.receipt_email;
  }
  
  // If no email found directly, try from customer ID if available
  if (!customerEmail && session.customer && typeof session.customer === 'string') {
    try {
      console.log('Looking up customer by ID:', session.customer);
      const customer = await stripe.customers.retrieve(session.customer) as Stripe.Customer;
      
      if (!customer.deleted && customer.email) {
        console.log('Found email from Stripe customer lookup:', customer.email);
        customerEmail = customer.email;
      }
    } catch (error: any) {
      console.error('Error retrieving customer:', error.message);
    }
  }
  
  if (!customerEmail) {
    console.error('Could not find a valid email address in the session data');
  }
  
  return customerEmail;
}

// Helper function for membership details
function getMembershipDetails(membershipType: string): {
  name: string;
  price: string;
  description: string;
  duration: string;
} {
  switch (membershipType) {
    case 'digital':
      return {
        name: "Adhésion Numérique",
        price: "10€",
        description: "Accès à tous les services numériques ANDAR",
        duration: "1 an"
      };
    case 'classic':
      return {
        name: "Adhésion Classique",
        price: "25€",
        description: "Adhésion complète à ANDAR",
        duration: "1 an"
      };
    case 'premium':
      return {
        name: "Adhésion Premium",
        price: "50€",
        description: "Adhésion premium à ANDAR avec tous les avantages",
        duration: "1 an"
      };
    default:
      return {
        name: "Adhésion ANDAR",
        price: "Variable",
        description: "Merci pour votre adhésion à ANDAR",
        duration: "1 an"
      };
  }
}

// Determine membership type from session data
function determineMembershipType(session: any): string {
  // First check metadata
  if (session.metadata && session.metadata.membershipType) {
    return session.metadata.membershipType;
  }
  
  // Then check based on amount
  if (session.amount_total) {
    if (session.amount_total === 1000) return 'digital';
    if (session.amount_total === 2500) return 'classic';
    if (session.amount_total >= 5000) return 'premium';
  }
  
  // Default fallback
  return 'digital';
}

// Main webhook handler
const webhookHandler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  
  const timestamp = new Date().toISOString();
  console.log(`=== WEBHOOK REQUEST RECEIVED AT ${timestamp} ===`);
  
  try {
    // Get Stripe keys
    const { secretKey, webhookSecret } = getStripeKeys();
    
    if (!secretKey) {
      console.error('Missing Stripe secret key');
      res.status(500).send('Server configuration error');
      return;
    }
    
    // Initialize Stripe
    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16' as Stripe.ApiVersion,
    });
    
    // Get raw body for signature verification
    const rawBody = await buffer(req);
    
    // Process the event
    const sig = req.headers['stripe-signature'] as string | undefined;
    const isDebugMode = process.env.DEBUG_WEBHOOK === 'true';
    let stripeEvent: Stripe.Event;
    
    if (isDebugMode && !sig) {
      console.log('DEBUG MODE: Bypassing signature verification');
      stripeEvent = JSON.parse(rawBody.toString()) as Stripe.Event;
    } else if (sig && webhookSecret) {
      try {
        stripeEvent = stripe.webhooks.constructEvent(rawBody.toString(), sig, webhookSecret);
        console.log('Webhook signature verified!');
      } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
      }
    } else {
      console.error('Missing signature header or webhook secret');
      res.status(400).send('Missing signature header or webhook secret');
      return;
    }
    
    // Handle the event
    console.log(`Event type: ${stripeEvent.type}`);
    console.log(`Event ID: ${stripeEvent.id}`);
    
    if (stripeEvent.type === 'checkout.session.completed') {
      console.log('Processing checkout.session.completed event...');
      
      const session = stripeEvent.data.object;
      console.log('Session ID:', session.id);
      
      // Extract email
      const customerEmail = await extractCustomerEmail(session, stripe);
      
      if (customerEmail) {
        // Get customer name
        const customerDetailsName = session.customer_details?.name;
        const customerName = customerDetailsName || 'Adhérent';
        
        // Determine membership type
        const membershipType = determineMembershipType(session);
        
        // Send confirmation email with retry logic
        console.log(`Sending confirmation email to ${customerEmail}`);
        const emailResult = await sendConfirmationEmailWithRetry(
          customerEmail,
          customerName,
          membershipType
        );
        
        if (emailResult.success) {
          console.log('✅ Confirmation email sent successfully!');
        } else {
          console.error('❌ Failed to send confirmation email:', emailResult.error);
        }
      } else {
        console.error('❌ Could not extract customer email, skipping email sending');
      }
    }
    
    // Return a response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error(`Error processing webhook: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

export default webhookHandler; 