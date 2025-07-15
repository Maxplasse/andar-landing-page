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

// Initialize Brevo API client with extensive logging
function initializeBrevoClient() {
  console.log('WEBHOOK-DEBUG: Initializing Brevo API client...');
  
  try {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    
    console.log('WEBHOOK-DEBUG: BREVO_API_KEY exists:', Boolean(process.env.BREVO_API_KEY));
    if (process.env.BREVO_API_KEY) {
      console.log('WEBHOOK-DEBUG: BREVO_API_KEY starts with:', process.env.BREVO_API_KEY.substring(0, 5) + '...');
      console.log('WEBHOOK-DEBUG: BREVO_API_KEY length:', process.env.BREVO_API_KEY.length);
    }
    
    apiKey.apiKey = process.env.BREVO_API_KEY;
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    
    console.log('WEBHOOK-DEBUG: Brevo API client initialized successfully');
    return apiInstance;
  } catch (error) {
    console.error('WEBHOOK-DEBUG: Error initializing Brevo API client:', error);
    throw error;
  }
}

// Function to send confirmation email with detailed logging
async function sendConfirmationEmail(email: string, name: string, membershipType: string) {
  console.log(`WEBHOOK-DEBUG: Preparing to send confirmation email to ${email}`);
  console.log(`WEBHOOK-DEBUG: Customer name: ${name}`);
  console.log(`WEBHOOK-DEBUG: Membership type: ${membershipType}`);
  
  try {
    const apiInstance = initializeBrevoClient();
    
    // Create sender info
    const sender = {
      email: process.env.BREVO_SENDER_EMAIL || 'solene.legendre@polyarthrite-andar.com',
      name: process.env.BREVO_SENDER_NAME || 'ANDAR'
    };
    console.log('WEBHOOK-DEBUG: Using sender:', JSON.stringify(sender));
    
    // Get membership details
    const membershipDetails = getMembershipDetails(membershipType);
    console.log('WEBHOOK-DEBUG: Membership details:', JSON.stringify(membershipDetails));
    
    // Create email with template
    console.log('WEBHOOK-DEBUG: Creating email with template ID 7...');
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
    
    console.log('WEBHOOK-DEBUG: Email template configured. About to call Brevo API...');
    console.log('WEBHOOK-DEBUG: Email template params:', JSON.stringify(templateEmail.params));
    
    // Send the email
    const response = await apiInstance.sendTransacEmail(templateEmail);
    
    console.log('WEBHOOK-DEBUG: ✅ Email sent successfully!');
    console.log('WEBHOOK-DEBUG: Response:', JSON.stringify(response));
    return { success: true, messageId: response.messageId };
  } catch (error) {
    console.error('WEBHOOK-DEBUG: ❌ Error sending email:', error);
    
    // Log detailed error information
    if (error && typeof error === 'object' && 'response' in error && 
        error.response && typeof error.response === 'object') {
      if ('status' in error.response) {
        console.error('WEBHOOK-DEBUG: Error status:', error.response.status);
      }
      let errorDetails = '';
      if ('text' in error.response && error.response.text && typeof error.response.text === 'string') {
        errorDetails = error.response.text;
      } else if ('data' in error.response) {
        errorDetails = JSON.stringify(error.response.data);
      }
      console.error('WEBHOOK-DEBUG: Error details:', errorDetails);
    }
    
    return { success: false, error };
  }
}

// Helper function for membership details
function getMembershipDetails(membershipType: string) {
  console.log(`WEBHOOK-DEBUG: Getting membership details for type ${membershipType}`);
  
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

// Extract customer email with extensive logging
async function extractCustomerEmail(session: any, stripe: Stripe) {
  console.log('WEBHOOK-DEBUG: Extracting customer email from session data...');
  console.log('WEBHOOK-DEBUG: Session ID:', session.id);
  
  // Log the entire session object for debugging (excluding sensitive data)
  const sensitiveFieldsRemoved = { ...session };
  delete sensitiveFieldsRemoved.payment_intent;
  delete sensitiveFieldsRemoved.customer;
  delete sensitiveFieldsRemoved.invoice;
  console.log('WEBHOOK-DEBUG: Session data (partial):', JSON.stringify(sensitiveFieldsRemoved));
  
  // Try all the possible locations directly in the session
  const locations = [
    { source: 'customer_details.email', value: session.customer_details?.email },
    { source: 'customer_email', value: session.customer_email },
    { source: 'metadata.email', value: session.metadata?.email },
  ];
  
  // Check receipt_email if it exists
  if ('receipt_email' in session) {
    locations.push({ source: 'receipt_email', value: session.receipt_email });
  }
  
  // Check if customer is an object with email
  if (session.customer && typeof session.customer === 'object' && 'email' in session.customer) {
    locations.push({ source: 'customer object', value: session.customer.email });
  }
  
  // Log all found locations
  console.log('WEBHOOK-DEBUG: Checking for email in these locations:');
  locations.forEach(loc => {
    console.log(`WEBHOOK-DEBUG: - ${loc.source}: ${loc.value || 'not found'}`);
  });
  
  // Find the first valid email
  const emailLocation = locations.find(loc => loc.value);
  
  if (emailLocation) {
    console.log(`WEBHOOK-DEBUG: ✅ Found customer email in ${emailLocation.source}: ${emailLocation.value}`);
    return emailLocation.value;
  }
  
  // If no email found directly, try from customer ID if available
  if (session.customer && typeof session.customer === 'string') {
    try {
      console.log(`WEBHOOK-DEBUG: Looking up customer by ID: ${session.customer}`);
      const customer = await stripe.customers.retrieve(session.customer);
      
      if (!customer.deleted && 'email' in customer) {
        console.log(`WEBHOOK-DEBUG: ✅ Found email from Stripe customer lookup: ${customer.email}`);
        return customer.email;
      }
    } catch (error) {
      console.error('WEBHOOK-DEBUG: Error retrieving customer:', 
        error && typeof error === 'object' && 'message' in error 
          ? error.message 
          : 'Unknown error'
      );
    }
  }
  
  console.log('WEBHOOK-DEBUG: ❌ Could not find a valid email address in the session data');
  return null;
}

// Determine membership type from session data
function determineMembershipType(session: any): string {
  console.log('WEBHOOK-DEBUG: Determining membership type...');
  
  // First check metadata
  if (session.metadata?.membershipType) {
    console.log(`WEBHOOK-DEBUG: Found membership type in metadata: ${session.metadata.membershipType}`);
    return session.metadata.membershipType;
  }
  
  // Then check based on amount
  if (session.amount_total) {
    console.log(`WEBHOOK-DEBUG: Checking amount_total: ${session.amount_total}`);
    
    if (session.amount_total === 1000) {
      console.log('WEBHOOK-DEBUG: Amount matches digital membership (10€)');
      return 'digital';
    } else if (session.amount_total === 2500) {
      console.log('WEBHOOK-DEBUG: Amount matches classic membership (25€)');
      return 'classic';
    } else if (session.amount_total >= 5000) {
      console.log('WEBHOOK-DEBUG: Amount matches premium membership (50€+)');
      return 'premium';
    }
  }
  
  // Default fallback
  console.log('WEBHOOK-DEBUG: Could not determine membership type, defaulting to digital');
  return 'digital';
}

// Webhook handler with extreme debugging
const webhookHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    console.log('WEBHOOK-DEBUG: Received non-POST request, returning 405');
    return res.status(405).send('Method Not Allowed');
  }
  
  const timestamp = new Date().toISOString();
  console.log(`WEBHOOK-DEBUG: === WEBHOOK REQUEST RECEIVED AT ${timestamp} ===`);
  console.log('WEBHOOK-DEBUG: Headers:', JSON.stringify(req.headers));
  
  // Print environment information
  console.log('WEBHOOK-DEBUG: NODE_ENV:', process.env.NODE_ENV);
  console.log('WEBHOOK-DEBUG: DEBUG_WEBHOOK:', process.env.DEBUG_WEBHOOK);
  console.log('WEBHOOK-DEBUG: VERBOSE_DEBUG:', process.env.VERBOSE_DEBUG);
  console.log('WEBHOOK-DEBUG: BREVO_API_KEY exists:', Boolean(process.env.BREVO_API_KEY));
  console.log('WEBHOOK-DEBUG: BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL);
  console.log('WEBHOOK-DEBUG: STRIPE_WEBHOOK_SECRET exists:', Boolean(process.env.STRIPE_WEBHOOK_SECRET));
  console.log('WEBHOOK-DEBUG: STRIPE_CLI_WEBHOOK_SECRET exists:', Boolean(process.env.STRIPE_CLI_WEBHOOK_SECRET));
  
  // Setup Stripe
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.error('WEBHOOK-DEBUG: Missing STRIPE_SECRET_KEY');
    return res.status(500).send('Server configuration error');
  }
  
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-02-24.acacia',
  });
  
  // Get webhook secret
  const webhookSecret = 
    process.env.DEBUG_WEBHOOK === 'true' 
      ? process.env.STRIPE_CLI_WEBHOOK_SECRET 
      : process.env.STRIPE_WEBHOOK_SECRET;
      
  console.log('WEBHOOK-DEBUG: Using webhook secret:', webhookSecret ? 'present' : 'missing');
  
  if (!webhookSecret && process.env.DEBUG_WEBHOOK !== 'true') {
    console.error('WEBHOOK-DEBUG: Missing webhook secret and not in debug mode');
    return res.status(500).send('Server configuration error');
  }
  
  try {
    // Get raw body for signature verification
    const rawBody = await buffer(req);
    console.log('WEBHOOK-DEBUG: Raw body length:', rawBody.length);
    
    // Verify signature if not in debug mode
    const sig = req.headers['stripe-signature'] as string;
    console.log('WEBHOOK-DEBUG: Stripe signature:', sig ? `${sig.substring(0, 20)}...` : 'MISSING');
    
    let stripeEvent;
    const isDebugMode = process.env.DEBUG_WEBHOOK === 'true';
    
    if (isDebugMode && !sig) {
      console.log('WEBHOOK-DEBUG: 🔍 DEBUG MODE: Bypassing signature verification');
      stripeEvent = JSON.parse(rawBody.toString());
    } else if (sig && webhookSecret) {
      console.log('WEBHOOK-DEBUG: Verifying webhook signature...');
      try {
        stripeEvent = stripe.webhooks.constructEvent(rawBody.toString(), sig, webhookSecret);
        console.log('WEBHOOK-DEBUG: ✅ Webhook signature verified!');
      } catch (err: any) {
        console.error(`WEBHOOK-DEBUG: ❌ Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      console.error('WEBHOOK-DEBUG: Missing signature header or webhook secret');
      return res.status(400).send('Missing signature header or webhook secret');
    }
    
    // Process event based on type
    console.log(`WEBHOOK-DEBUG: Event type: ${stripeEvent.type}`);
    console.log(`WEBHOOK-DEBUG: Event ID: ${stripeEvent.id}`);
    
    if (stripeEvent.type === 'checkout.session.completed') {
      console.log('WEBHOOK-DEBUG: Processing checkout.session.completed event...');
      const session = stripeEvent.data.object;
      
      // Extract email
      const customerEmail = await extractCustomerEmail(session, stripe);
      
      if (customerEmail) {
        // Get customer name
        const customerName = session.customer_details?.name || 'Adhérent';
        console.log(`WEBHOOK-DEBUG: Customer name: ${customerName}`);
        
        // Determine membership type
        const membershipType = determineMembershipType(session);
        
        // Send confirmation email
        console.log(`WEBHOOK-DEBUG: Sending confirmation email to ${customerEmail}`);
        const emailResult = await sendConfirmationEmail(
          customerEmail,
          customerName,
          membershipType
        );
        
        if (emailResult.success) {
          console.log(`WEBHOOK-DEBUG: ✅ Confirmation email sent successfully! Message ID: ${emailResult.messageId}`);
        } else {
          console.error('WEBHOOK-DEBUG: ❌ Failed to send confirmation email');
        }
      } else {
        console.error('WEBHOOK-DEBUG: ❌ Could not extract customer email, skipping email sending');
      }
    } else {
      console.log(`WEBHOOK-DEBUG: Ignoring event type: ${stripeEvent.type}`);
    }
    
    // Return success
    console.log('WEBHOOK-DEBUG: Returning 200 success response');
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('WEBHOOK-DEBUG: Error processing webhook:', error);
    
    // Log detailed error information
    if (error && typeof error === 'object' && 'response' in error && 
        error.response && typeof error.response === 'object') {
      if ('status' in error.response) {
        console.error('WEBHOOK-DEBUG: Error status:', error.response.status);
      }
      let errorDetails = '';
      if ('text' in error.response && error.response.text && typeof error.response.text === 'string') {
        errorDetails = error.response.text;
      } else if ('data' in error.response) {
        errorDetails = JSON.stringify(error.response.data);
      }
      console.error('WEBHOOK-DEBUG: Error details:', errorDetails);
    }
    
    let errorMessage = 'Unknown error';
    if (typeof error === 'object' && error !== null && 'message' in error && 
        typeof error.message === 'string') {
      errorMessage = error.message;
    }
    
    return res.status(400).send(`Webhook Error: ${errorMessage}`);
  }
};

export default webhookHandler; 