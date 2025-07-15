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

// Enhanced webhook handler with detailed logging and email status reporting
const webhookHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  // For testing: Check if this is an email test request
  const isEmailTest = req.query.email_test === 'true';
  
  // Start timestamping
  const startTime = new Date();
  console.log(`[${startTime.toISOString()}] Webhook request received`);
  
  if (req.method !== 'POST') {
    console.log(`[${new Date().toISOString()}] Method not allowed: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get environment variables
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const isDebugMode = process.env.DEBUG_WEBHOOK === 'true' || req.query.debug === 'true';
    const webhookSecret = isDebugMode 
      ? process.env.STRIPE_CLI_WEBHOOK_SECRET 
      : process.env.STRIPE_WEBHOOK_SECRET;
    
    // Log environment state
    console.log(`[${new Date().toISOString()}] DEBUG_MODE: ${isDebugMode}`);
    console.log(`[${new Date().toISOString()}] STRIPE_SECRET_KEY exists: ${Boolean(stripeSecretKey)}`);
    console.log(`[${new Date().toISOString()}] WEBHOOK_SECRET exists: ${Boolean(webhookSecret)}`);
    console.log(`[${new Date().toISOString()}] BREVO_API_KEY exists: ${Boolean(process.env.BREVO_API_KEY)}`);
    
    if (!stripeSecretKey) {
      console.error(`[${new Date().toISOString()}] Missing Stripe secret key`);
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia',
    });
    
    // Get raw body for signature verification
    const rawBody = await buffer(req);
    console.log(`[${new Date().toISOString()}] Raw body received, length: ${rawBody.length}`);
    
    // Get the stripe signature from headers
    const sig = req.headers['stripe-signature'] as string;
    console.log(`[${new Date().toISOString()}] Stripe signature: ${sig ? 'present' : 'missing'}`);
    
    // Parse the event
    let event: Stripe.Event;
    
    if (isDebugMode && (!sig || isEmailTest)) {
      console.log(`[${new Date().toISOString()}] DEBUG MODE: Bypassing signature verification`);
      event = JSON.parse(rawBody.toString());
    } else if (sig && webhookSecret) {
      try {
        console.log(`[${new Date().toISOString()}] Verifying webhook signature`);
        event = stripe.webhooks.constructEvent(rawBody.toString(), sig, webhookSecret);
        console.log(`[${new Date().toISOString()}] Signature verified successfully`);
      } catch (err: any) {
        console.error(`[${new Date().toISOString()}] Webhook signature verification failed: ${err.message}`);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }
    } else {
      console.error(`[${new Date().toISOString()}] Missing signature or webhook secret`);
      return res.status(400).json({ error: 'Missing signature header or webhook secret' });
    }
    
    // Process the event
    console.log(`[${new Date().toISOString()}] Processing event type: ${event.type}`);
    
    if (event.type === 'checkout.session.completed') {
      console.log(`[${new Date().toISOString()}] Processing checkout.session.completed event`);
      const session = event.data.object;
      
      // Try to send an email confirmation
      const emailResult = await processCheckoutSession(session, stripe);
      
      // Enhanced response with email status
      return res.status(200).json({
        received: true,
        event_type: event.type,
        email_sent: emailResult.success,
        email_details: emailResult.success 
          ? { messageId: emailResult.messageId } 
          : { error: emailResult.error }
      });
    }
    
    // Default response for other event types
    console.log(`[${new Date().toISOString()}] Event type ${event.type} not processed`);
    return res.status(200).json({ received: true, event_type: event.type });
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}] Error processing webhook: ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
};

// Process a checkout session and send confirmation email
async function processCheckoutSession(session: any, stripe: Stripe): Promise<EmailResult> {
  console.log(`[${new Date().toISOString()}] Starting checkout session processing`);
  
  try {
    // Extract customer email
    const customerEmail = await extractCustomerEmail(session, stripe);
    
    if (!customerEmail) {
      console.error(`[${new Date().toISOString()}] Failed to extract customer email from session ${session.id}`);
      return { success: false, error: 'Could not extract customer email' };
    }
    
    console.log(`[${new Date().toISOString()}] Extracted customer email: ${customerEmail}`);
    
    // Get customer name
    const customerName = session.customer_details?.name || 'Client';
    console.log(`[${new Date().toISOString()}] Customer name: ${customerName}`);
    
    // Determine membership type
    const membershipType = determineMembershipType(session);
    console.log(`[${new Date().toISOString()}] Membership type: ${membershipType}`);
    
    // Send confirmation email
    console.log(`[${new Date().toISOString()}] Sending confirmation email to ${customerEmail}`);
    const emailResult = await sendConfirmationEmail(customerEmail, customerName, membershipType);
    
    if (emailResult.success) {
      console.log(`[${new Date().toISOString()}] ✅ Email sent successfully! Message ID: ${emailResult.messageId}`);
    } else {
      console.error(`[${new Date().toISOString()}] ❌ Failed to send confirmation email: ${emailResult.error}`);
    }
    
    return emailResult;
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error processing checkout session: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Initialize Brevo API client
function initializeBrevoClient() {
  try {
    console.log(`[${new Date().toISOString()}] Initializing Brevo API client`);
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is missing or empty');
    }
    
    apiKey.apiKey = process.env.BREVO_API_KEY;
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    console.log(`[${new Date().toISOString()}] Brevo API client initialized successfully`);
    return apiInstance;
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error initializing Brevo API client: ${error.message}`);
    throw error;
  }
}

// Send confirmation email
async function sendConfirmationEmail(email: string, name: string, membershipType: string): Promise<EmailResult> {
  console.log(`[${new Date().toISOString()}] Preparing to send confirmation email to ${email}`);
  
  try {
    const apiInstance = initializeBrevoClient();
    
    // Create sender info
    const sender = {
      email: process.env.BREVO_SENDER_EMAIL || 'solene.legendre@polyarthrite-andar.com',
      name: process.env.BREVO_SENDER_NAME || 'ANDAR'
    };
    
    // Get membership details
    const membershipDetails = getMembershipDetails(membershipType);
    
    // Create email with template
    console.log(`[${new Date().toISOString()}] Creating email with template ID 7`);
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
    console.log(`[${new Date().toISOString()}] Calling Brevo API to send email`);
    const response = await apiInstance.sendTransacEmail(templateEmail);
    
    console.log(`[${new Date().toISOString()}] Email sent successfully!`);
    console.log(`[${new Date().toISOString()}] Response:`, response);
    return { success: true, messageId: response.messageId };
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error sending email:`, error);
    
    // Log detailed error information
    if (error.response) {
      console.error(`[${new Date().toISOString()}] Error status:`, error.response.status);
      console.error(`[${new Date().toISOString()}] Error details:`, error.response.text);
    }
    
    return { success: false, error };
  }
}

// Extract customer email from session
async function extractCustomerEmail(session: any, stripe: Stripe): Promise<string | null> {
  console.log(`[${new Date().toISOString()}] Extracting customer email from session`);
  
  // Log session ID and important fields
  console.log(`[${new Date().toISOString()}] Session ID: ${session.id}`);
  
  if (session.customer_details) {
    console.log(`[${new Date().toISOString()}] customer_details:`, session.customer_details);
  }
  
  // Try all possible locations
  let customerEmail: string | null = null;
  
  // Check customer_details first
  if (session.customer_details && session.customer_details.email) {
    console.log(`[${new Date().toISOString()}] Found email in customer_details`);
    customerEmail = session.customer_details.email;
    return customerEmail;
  }
  
  // Check customer_email field
  if (session.customer_email) {
    console.log(`[${new Date().toISOString()}] Found email in customer_email field`);
    customerEmail = session.customer_email;
    return customerEmail;
  }
  
  // Check metadata
  if (session.metadata && session.metadata.email) {
    console.log(`[${new Date().toISOString()}] Found email in metadata`);
    customerEmail = session.metadata.email;
    return customerEmail;
  }
  
  // Check receipt_email if available
  if ('receipt_email' in session && session.receipt_email) {
    console.log(`[${new Date().toISOString()}] Found email in receipt_email`);
    customerEmail = session.receipt_email;
    return customerEmail;
  }
  
  // If customer is an object with email
  if (session.customer && typeof session.customer === 'object' && 'email' in session.customer) {
    console.log(`[${new Date().toISOString()}] Found email in customer object`);
    customerEmail = session.customer.email;
    return customerEmail;
  }
  
  // If payment_intent has receipt_email
  if (
    session.payment_intent && 
    typeof session.payment_intent === 'object' && 
    'receipt_email' in session.payment_intent && 
    session.payment_intent.receipt_email
  ) {
    console.log(`[${new Date().toISOString()}] Found email in payment_intent.receipt_email`);
    customerEmail = session.payment_intent.receipt_email;
    return customerEmail;
  }
  
  // If no email found directly, try from customer ID
  if (!customerEmail && session.customer && typeof session.customer === 'string') {
    try {
      console.log(`[${new Date().toISOString()}] Looking up customer by ID: ${session.customer}`);
      const customer = await stripe.customers.retrieve(session.customer) as Stripe.Customer;
      
      if (!customer.deleted && customer.email) {
        console.log(`[${new Date().toISOString()}] Found email from customer lookup: ${customer.email}`);
        customerEmail = customer.email;
        return customerEmail;
      }
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] Error retrieving customer: ${error.message}`);
    }
  }
  
  console.log(`[${new Date().toISOString()}] Could not find a valid email address in the session data`);
  return null;
}

// Helper function to get membership details
function getMembershipDetails(membershipType: string) {
  switch (membershipType) {
    case 'digital':
      return {
        name: "Adhésion Numérique",
        price: "5€",
        description: "Accès à tous les services numériques ANDAR",
        duration: "1 an"
      };
    case 'classic':
      return {
        name: "Adhésion Classique",
        price: "32€",
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
    if (session.amount_total === 500) return 'digital';
    if (session.amount_total === 3200) return 'classic';
    if (session.amount_total >= 5000) return 'premium';
  }
  
  // Default fallback
  return 'digital';
}

export default webhookHandler; 