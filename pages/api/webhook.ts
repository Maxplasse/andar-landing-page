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
  // Record entry timestamp
  const startTime = new Date();
  console.log(`[${startTime.toISOString()}] ====== WEBHOOK REQUEST RECEIVED ======`);
  console.log(`[${startTime.toISOString()}] Method: ${req.method}`);
  console.log(`[${startTime.toISOString()}] Query parameters:`, req.query);
  
  // For testing: Check if this is an email test request
  const isEmailTest = req.query.email_test === 'true';
  
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
    console.log(`[${new Date().toISOString()}] BREVO_SENDER_EMAIL: ${process.env.BREVO_SENDER_EMAIL || 'NOT SET'}`);
    console.log(`[${new Date().toISOString()}] BREVO_SENDER_NAME: ${process.env.BREVO_SENDER_NAME || 'NOT SET'}`);
    
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
    console.log(`[${new Date().toISOString()}] Webhook secret exists: ${Boolean(webhookSecret)}`);
    
    // Parse the event
    let event: Stripe.Event;
    
    try {
      // First try with signature verification
      if (sig && webhookSecret) {
        try {
          console.log(`[${new Date().toISOString()}] Attempting to verify webhook signature...`);
          event = stripe.webhooks.constructEvent(rawBody.toString(), sig, webhookSecret);
          console.log(`[${new Date().toISOString()}] ✅ Signature verified successfully!`);
        } catch (sigError: any) {
          console.error(`[${new Date().toISOString()}] ⚠️ Signature verification failed: ${sigError.message}`);
          console.log(`[${new Date().toISOString()}] Trying alternate webhook secret...`);
          
          // Try with the other webhook secret as fallback
          const otherSecret = isDebugMode 
            ? process.env.STRIPE_WEBHOOK_SECRET 
            : process.env.STRIPE_CLI_WEBHOOK_SECRET;
          
          if (otherSecret) {
            try {
              event = stripe.webhooks.constructEvent(rawBody.toString(), sig, otherSecret);
              console.log(`[${new Date().toISOString()}] ✅ Signature verified successfully with alternate secret!`);
            } catch (altError: any) {
              console.error(`[${new Date().toISOString()}] ❌ All signature verification attempts failed.`);
              
              // In production, still parse the event for debugging, but be careful about processing it
              if (process.env.NODE_ENV === 'production' && isDebugMode) {
                console.log(`[${new Date().toISOString()}] 🔍 DEBUGGING: Parsing event without signature verification`);
                event = JSON.parse(rawBody.toString());
              } else {
                return res.status(400).json({ error: `Webhook Error: Signature verification failed` });
              }
            }
          } else {
            // In debug mode, still parse the event
            if (isDebugMode) {
              console.log(`[${new Date().toISOString()}] 🔍 DEBUG MODE: Parsing event without signature verification`);
              event = JSON.parse(rawBody.toString());
            } else {
              return res.status(400).json({ error: `Webhook Error: ${sigError.message}` });
            }
          }
        }
      } else if (isDebugMode) {
        // Debug mode allows parsing without signature
        console.log(`[${new Date().toISOString()}] 🔍 DEBUG MODE: Bypassing signature verification`);
        event = JSON.parse(rawBody.toString());
      } else {
        console.error(`[${new Date().toISOString()}] ❌ Missing signature or webhook secret`);
        return res.status(400).json({ error: 'Missing signature header or webhook secret' });
      }
    } catch (parseError: any) {
      console.error(`[${new Date().toISOString()}] ❌ Failed to parse webhook body: ${parseError.message}`);
      return res.status(400).json({ error: `Webhook Error: ${parseError.message}` });
    }
    
    // Process the event
    console.log(`[${new Date().toISOString()}] ⚡ Processing event type: ${event.type}`);
    
    if (process.env.LOG_WEBHOOK_BODY === 'true') {
      console.log(`[${new Date().toISOString()}] Full event body:`, JSON.stringify(event, null, 2));
    }
    
    if (event.type === 'checkout.session.completed') {
      console.log(`[${new Date().toISOString()}] 🔔 CHECKOUT SESSION COMPLETED EVENT RECEIVED 🔔`);
      console.log(`[${new Date().toISOString()}] Event ID: ${event.id}`);
      
      const session = event.data.object;
      
      // Log ALL session properties to help debug
      console.log(`[${new Date().toISOString()}] Session ID: ${session.id}`);
      console.log(`[${new Date().toISOString()}] Session amount: ${session.amount_total}`);
      console.log(`[${new Date().toISOString()}] Session currency: ${session.currency}`);
      console.log(`[${new Date().toISOString()}] Session mode: ${session.mode}`);
      console.log(`[${new Date().toISOString()}] Session status: ${session.status}`);
      
      if (session.customer) {
        console.log(`[${new Date().toISOString()}] Session customer: ${typeof session.customer === 'string' ? session.customer : JSON.stringify(session.customer)}`);
      }
      
      // Log customer details
      if (session.customer_details) {
        console.log(`[${new Date().toISOString()}] Customer details:`, JSON.stringify(session.customer_details, null, 2));
      } else {
        console.log(`[${new Date().toISOString()}] ⚠️ No customer_details in session`);
      }
      
      // Log metadata
      if (session.metadata) {
        console.log(`[${new Date().toISOString()}] Metadata:`, JSON.stringify(session.metadata, null, 2));
      } else {
        console.log(`[${new Date().toISOString()}] ⚠️ No metadata in session`);
      }
      
      // Try to send an email confirmation
      console.log(`[${new Date().toISOString()}] 📬 Attempting to send confirmation email...`);
      const emailResult = await processCheckoutSession(session, stripe);
      
      // Log final status
      if (emailResult.success) {
        console.log(`[${new Date().toISOString()}] ✅ WEBHOOK PROCESSING COMPLETED SUCCESSFULLY`);
        console.log(`[${new Date().toISOString()}] Email sent to customer with message ID: ${emailResult.messageId}`);
      } else {
        console.error(`[${new Date().toISOString()}] ❌ WEBHOOK PROCESSING FAILED: Unable to send email`);
        console.error(`[${new Date().toISOString()}] Error:`, emailResult.error);
      }
      
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
    console.log(`[${new Date().toISOString()}] Event type ${event.type} not processed (not a checkout.session.completed event)`);
    return res.status(200).json({ received: true, event_type: event.type });
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}] Error processing webhook: ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
};

// Process a checkout session and send confirmation email
async function processCheckoutSession(session: any, stripe: Stripe): Promise<EmailResult> {
  console.log(`[${new Date().toISOString()}] ====== PROCESSING CHECKOUT SESSION ======`);
  console.log(`[${new Date().toISOString()}] Session ID: ${session.id}`);
  
  try {
    // Extract customer email
    console.log(`[${new Date().toISOString()}] Extracting customer email from session...`);
    const customerEmail = await extractCustomerEmail(session, stripe);
    
    if (!customerEmail) {
      console.error(`[${new Date().toISOString()}] ❌ CRITICAL ERROR: Failed to extract customer email from session ${session.id}`);
      return { success: false, error: 'Could not extract customer email' };
    }
    
    console.log(`[${new Date().toISOString()}] ✅ Successfully extracted customer email: ${customerEmail}`);
    
    // Get customer name
    const customerName = session.customer_details?.name || 'Client';
    console.log(`[${new Date().toISOString()}] Customer name: ${customerName}`);
    
    // Determine membership type
    console.log(`[${new Date().toISOString()}] Determining membership type from session data...`);
    console.log(`[${new Date().toISOString()}] Session amount_total: ${session.amount_total}`);
    if (session.metadata?.membershipType) {
      console.log(`[${new Date().toISOString()}] Found membershipType in metadata: ${session.metadata.membershipType}`);
    }
    
    const membershipType = determineMembershipType(session);
    console.log(`[${new Date().toISOString()}] Determined membership type: ${membershipType}`);
    
    // Get membership details for email
    const details = getMembershipDetails(membershipType);
    console.log(`[${new Date().toISOString()}] Membership details for email:`, details);
    
    // Send confirmation email
    console.log(`[${new Date().toISOString()}] ====== SENDING CONFIRMATION EMAIL ======`);
    console.log(`[${new Date().toISOString()}] To: ${customerEmail} (${customerName})`);
    console.log(`[${new Date().toISOString()}] Membership type: ${membershipType}`);
    
    const emailResult = await sendConfirmationEmail(customerEmail, customerName, membershipType);
    
    if (emailResult.success) {
      console.log(`[${new Date().toISOString()}] ✅ EMAIL SENT SUCCESSFULLY! Message ID: ${emailResult.messageId}`);
    } else {
      console.error(`[${new Date().toISOString()}] ❌ FAILED TO SEND CONFIRMATION EMAIL`);
      console.error(`[${new Date().toISOString()}] Error:`, emailResult.error);
    }
    
    return emailResult;
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] ❌ CRITICAL ERROR processing checkout session:`, error);
    console.error(`[${new Date().toISOString()}] Error message: ${error.message}`);
    console.error(`[${new Date().toISOString()}] Stack trace: ${error.stack}`);
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
  console.log(`[${new Date().toISOString()}] 📧 PREPARING TO SEND CONFIRMATION EMAIL 📧`);
  console.log(`[${new Date().toISOString()}] To: ${email} (${name})`);
  console.log(`[${new Date().toISOString()}] Membership type: ${membershipType}`);
  
  // Check environment variables
  if (!process.env.BREVO_API_KEY) {
    console.error(`[${new Date().toISOString()}] ❌ CRITICAL ERROR: BREVO_API_KEY is not set!`);
    return { success: false, error: new Error('BREVO_API_KEY is missing') };
  }

  console.log(`[${new Date().toISOString()}] BREVO_API_KEY exists: ${Boolean(process.env.BREVO_API_KEY)}`);
  console.log(`[${new Date().toISOString()}] BREVO_SENDER_EMAIL: ${process.env.BREVO_SENDER_EMAIL || 'NOT SET'}`);
  console.log(`[${new Date().toISOString()}] BREVO_SENDER_NAME: ${process.env.BREVO_SENDER_NAME || 'NOT SET'}`);
  
  try {
    const apiInstance = initializeBrevoClient();
    
    // Create sender info
    const sender = {
      email: process.env.BREVO_SENDER_EMAIL || 'solene.legendre@polyarthrite-andar.com',
      name: process.env.BREVO_SENDER_NAME || 'ANDAR'
    };
    
    console.log(`[${new Date().toISOString()}] Using sender: ${sender.name} <${sender.email}>`);
    
    // Get membership details
    const membershipDetails = getMembershipDetails(membershipType);
    console.log(`[${new Date().toISOString()}] Membership details: ${JSON.stringify(membershipDetails)}`);
    
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
    console.log(`[${new Date().toISOString()}] 📨 SENDING EMAIL via Brevo API 📨`);
    
    // Add a timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout exceeded when sending email')), 10000);
    });
    
    // Create the actual API call
    const apiPromise = apiInstance.sendTransacEmail(templateEmail);
    
    // Race the timeout against the API call
    const response = await Promise.race([apiPromise, timeoutPromise]);
    
    console.log(`[${new Date().toISOString()}] ✅ EMAIL SENT SUCCESSFULLY!`);
    console.log(`[${new Date().toISOString()}] Message ID: ${response.messageId}`);
    return { success: true, messageId: response.messageId };
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] ❌ ERROR SENDING EMAIL:`, error);
    
    // Log detailed error information
    if (error.response) {
      console.error(`[${new Date().toISOString()}] Error status:`, error.response.status);
      console.error(`[${new Date().toISOString()}] Error details:`, error.response.text);
    }
    
    // Try a fallback approach - direct sending without template
    try {
      console.log(`[${new Date().toISOString()}] 🔄 Attempting fallback - direct email without template`);
      const result = await sendDirectEmail(email, name, membershipType);
      return result;
    } catch (fallbackError: any) {
      console.error(`[${new Date().toISOString()}] ❌ FALLBACK ALSO FAILED:`, fallbackError);
      return { success: false, error };
    }
  }
}

// Add a direct email sending function as fallback
async function sendDirectEmail(email: string, name: string, membershipType: string): Promise<EmailResult> {
  console.log(`[${new Date().toISOString()}] Sending direct email without template to ${email}`);
  
  try {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    
    // Create sender info
    const sender = {
      email: process.env.BREVO_SENDER_EMAIL || 'solene.legendre@polyarthrite-andar.com',
      name: process.env.BREVO_SENDER_NAME || 'ANDAR'
    };
    
    // Get membership details
    const details = getMembershipDetails(membershipType);
    
    // Create email send request
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    sendSmtpEmail.to = [{
      email: email,
      name: name || email.split('@')[0]
    }];
    
    sendSmtpEmail.subject = 'Confirmation de votre adhésion à ANDAR';
    
    // Create HTML content manually
    sendSmtpEmail.htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://adhesion.soutenir-polyarthrite.fr/images/logo_andar.png" alt="ANDAR Logo" style="max-width: 200px;">
          </div>
          
          <h1 style="color: #13477b;">Confirmation d'adhésion</h1>
          
          <p>Bonjour ${name},</p>
          
          <p>Nous vous remercions pour votre adhésion à ANDAR ! Nous sommes ravis de vous compter parmi nos membres.</p>
          
          <p>Votre soutien est essentiel pour nous permettre de continuer nos actions et de développer nos services pour tous les patients atteints de polyarthrite rhumatoïde.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Type d'adhésion :</strong> ${details.name}</p>
            <p><strong>Montant :</strong> ${details.price}</p>
            <p><strong>Avantages :</strong> ${details.description}</p>
            <p><strong>Durée :</strong> ${details.duration}</p>
            <p><strong>Date d'adhésion :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          
          <p>Si vous avez des questions, n'hésitez pas à nous contacter à <a href="mailto:polyarthrite-andar@polyarthrite-andar.com">polyarthrite-andar@polyarthrite-andar.com</a>.</p>
          
          <p>Cordialement,<br>L'équipe ANDAR</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
            <p>ANDAR - Association Nationale de Défense contre l'Arthrite Rhumatoïde</p>
            <p>Siège social : 75011 Paris</p>
            <p>Email: polyarthrite-andar@polyarthrite-andar.com</p>
          </div>
        </div>
      </body>
    </html>
    `;
    
    sendSmtpEmail.sender = sender;
    
    // Send the email
    console.log(`[${new Date().toISOString()}] Sending direct email...`);
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log(`[${new Date().toISOString()}] ✅ Direct email sent successfully!`);
    console.log(`[${new Date().toISOString()}] Message ID: ${response.messageId}`);
    
    return { success: true, messageId: response.messageId };
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] ❌ Error sending direct email:`, error);
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