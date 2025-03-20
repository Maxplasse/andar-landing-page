import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { sendMembershipConfirmationEmail } from '../../utils/email';

// Disable the default body parser to receive the raw body for Stripe signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to determine if we're in production mode
const isProduction = process.env.NODE_ENV === 'production';

// Select the appropriate Stripe keys based on environment
const getStripeKeys = () => {
  if (isProduction && process.env.STRIPE_LIVE_SECRET_KEY) {
    return {
      secretKey: process.env.STRIPE_LIVE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_LIVE_WEBHOOK_SECRET
    };
  }
  
  // Special handling for Stripe CLI during development
  // When using the Stripe CLI to forward events, we should use the CLI webhook secret
  if (!isProduction && 
      process.env.USE_STRIPE_CLI === 'true' && 
      process.env.STRIPE_CLI_WEBHOOK_SECRET) {
    console.log('Using Stripe CLI webhook secret for verification');
    return {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_CLI_WEBHOOK_SECRET
    };
  }
  
  // Default to regular webhook secret
  return {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  };
};

/**
 * Enhanced email sending with retry and better error handling 
 */
const sendConfirmationEmailWithRetry = async (
  email: string, 
  name: string, 
  membershipType: string,
  maxRetries = 3
) => {
  console.log(`Attempting to send confirmation email to ${email} with ${maxRetries} max retries`);
  
  let attempt = 0;
  let emailSent = false;
  let lastError = null;
  
  // Log environment variables for debugging
  console.log('Environment check:');
  console.log('- BREVO_API_KEY exists:', Boolean(process.env.BREVO_API_KEY));
  console.log('- BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL || 'Not set');
  console.log('- BREVO_SENDER_NAME:', process.env.BREVO_SENDER_NAME || 'Not set');
  
  while (attempt < maxRetries && !emailSent) {
    try {
      attempt++;
      console.log(`Email attempt ${attempt}/${maxRetries} to ${email}`);
      
      const result = await sendMembershipConfirmationEmail(email, name, membershipType);
      
      if (result.success) {
        console.log(`✅ Email sent successfully on attempt ${attempt}!`);
        console.log('Message ID:', result.data.messageId);
        return { success: true, messageId: result.data.messageId, attempts: attempt };
      } else {
        lastError = result.error;
        console.error(`❌ Failed to send email (attempt ${attempt}/${maxRetries}):`, result.error);
      }
    } catch (error) {
      lastError = error;
      console.error(`❌ Error in email sending (attempt ${attempt}/${maxRetries}):`, error);
    }
    
    // If we have more retries to go, wait before trying again
    if (attempt < maxRetries) {
      const delay = attempt * 1000; // Increase delay with each retry
      console.log(`Waiting ${delay}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { 
    success: false, 
    error: lastError, 
    attempts: attempt, 
    message: `Failed to send email after ${attempt} attempts` 
  };
};

/**
 * Robust function to extract customer email from Stripe session
 */
const extractCustomerEmail = async (session: Stripe.Checkout.Session, stripe: Stripe) => {
  console.log('Extracting customer email from session data...');
  
  // Try all the possible locations directly in the session
  let customerEmail = 
    session.customer_details?.email ||
    session.customer_email ||
    (session.customer && typeof session.customer === 'object' && 'email' in session.customer ? 
      (session.customer as any).email : null) ||
    (session.payment_intent && typeof session.payment_intent === 'object' ? 
      (session.payment_intent as any).receipt_email : null) ||
    session.metadata?.email;
      
  if (customerEmail) {
    console.log(`Found customer email directly in session: ${customerEmail}`);
    return customerEmail;
  }
  
  console.log('Email not found directly in session, trying secondary methods...');
  
  // If email not found directly, try other methods
  const customerId = session.customer;
  
  // Try to get from receipt_email if exists - use type assertion since it's not in the type
  if ((session as any).receipt_email) {
    customerEmail = (session as any).receipt_email;
    console.log(`Found customer email in receipt_email: ${customerEmail}`);
    return customerEmail;
  }
  
  // Try to get customer data if we have a customer ID
  if (customerId && typeof customerId === 'string') {
    try {
      console.log(`Retrieving customer details for ID: ${customerId}`);
      const customer = await stripe.customers.retrieve(customerId);
      
      if (!customer.deleted && 'email' in customer && customer.email) {
        customerEmail = customer.email;
        console.log(`Found customer email from customer object: ${customerEmail}`);
        return customerEmail;
      }
    } catch (error) {
      console.error('Error retrieving customer:', error);
    }
  }
  
  // Try to get from payment intent if available as a string ID
  if (session.payment_intent && typeof session.payment_intent === 'string') {
    try {
      console.log(`Retrieving payment intent: ${session.payment_intent}`);
      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
      
      // Try receipt_email on payment intent - use type assertion
      if ((paymentIntent as any).receipt_email) {
        customerEmail = (paymentIntent as any).receipt_email;
        console.log(`Found email in payment intent receipt_email: ${customerEmail}`);
        return customerEmail;
      }
      
      // Try billing details from charges - use type assertion for charges
      if ((paymentIntent as any).charges?.data?.length > 0) {
        const charge = (paymentIntent as any).charges.data[0];
        
        if (charge.billing_details?.email) {
          customerEmail = charge.billing_details.email;
          console.log(`Found email in charge billing details: ${customerEmail}`);
          return customerEmail;
        }
      }
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
    }
  }
  
  // If client_reference_id looks like an email, use it
  if (session.client_reference_id && session.client_reference_id.includes('@')) {
    customerEmail = session.client_reference_id;
    console.log(`Using client_reference_id as email: ${customerEmail}`);
    return customerEmail;
  }
  
  console.log('❌ No customer email could be found in the session data');
  return null;
};

/**
 * Determine membership type from session data
 */
const determineMembershipType = (session: Stripe.Checkout.Session): string => {
  // First try metadata
  if (session.metadata?.membershipType) {
    console.log(`Found membership type in metadata: ${session.metadata.membershipType}`);
    return session.metadata.membershipType;
  }
  
  // Then try from amount
  if (session.amount_total) {
    if (session.amount_total === 1000) { // 10 EUR
      console.log('Determined digital membership from amount (10€)');
      return 'digital';
    } else if (session.amount_total === 2500) { // 25 EUR
      console.log('Determined classic membership from amount (25€)');
      return 'classic';
    } else if (session.amount_total >= 5000) { // 50+ EUR
      console.log('Determined premium membership from amount (50€+)');
      return 'premium';
    }
  }
  
  // Default to digital if we can't determine
  console.log('Using default membership type: digital');
  return 'digital';
};

const webhookHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  console.log('🔔 Webhook received!', new Date().toISOString());
  
  const { secretKey, webhookSecret } = getStripeKeys();
  
  // Log webhook secret (prefix only for security)
  if (webhookSecret) {
    console.log('Webhook secret prefix:', webhookSecret.substring(0, 10) + '...');
  } else {
    console.error('⚠️ Webhook secret not configured');
  }
  
  // First, check if the webhook secret is configured
  if (!webhookSecret) {
    console.error('Webhook secret not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  // Initialize Stripe
  const stripe = new Stripe(secretKey as string, {
    apiVersion: '2023-10-16' as any,
  });

  try {
    // Get the raw body for signature verification
    const rawBody = await buffer(req);
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      console.error('Missing Stripe signature header');
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    console.log('Verifying webhook signature...');
    
    // Special debug mode for development
    if (!isProduction && process.env.DEBUG_WEBHOOK === 'true') {
      console.log('DEBUG MODE: Bypassing signature verification');
      
      try {
        // Parse the raw body as JSON
        const payload = JSON.parse(rawBody.toString());
        
        // Check if this is a checkout.session.completed event
        if (payload.type === 'checkout.session.completed') {
          console.log('Processing checkout.session.completed in debug mode');
          const session = payload.data.object;
          
          // Extract email using our robust function
          const customerEmail = await extractCustomerEmail(session, stripe);
          
          if (customerEmail) {
            const customerName = session.customer_details?.name || 'Adhérent';
            const membershipType = determineMembershipType(session);
            
            console.log(`Sending confirmation email to ${customerEmail} (${customerName}) for ${membershipType} membership`);
            
            // Send email with retry logic
            const emailResult = await sendConfirmationEmailWithRetry(
              customerEmail,
              customerName,
              membershipType
            );
            
            if (emailResult.success) {
              console.log('✅ Email sent successfully in debug mode!');
            } else {
              console.error('❌ Failed to send email in debug mode:', emailResult.message);
            }
          } else {
            console.error('❌ Could not extract customer email from session in debug mode');
          }
        } else {
          console.log(`Unhandled event type in debug mode: ${payload.type}`);
        }
        
        return res.status(200).json({ received: true });
      } catch (e) {
        console.error('Error in debug mode:', e);
        return res.status(400).json({ error: 'Invalid payload in debug mode' });
      }
    }
    
    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      console.error(`❌ Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    console.log(`✅ Webhook verified - Event type: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`📦 Processing checkout.session.completed for session: ${session.id}`);
        
        // Log raw session data for debugging
        console.log('Session data sample:', JSON.stringify(session).substring(0, 500) + '...');
        
        // Extract email using our robust function
        const customerEmail = await extractCustomerEmail(session, stripe);
        
        if (customerEmail) {
          const customerName = session.customer_details?.name || 'Adhérent';
          const membershipType = determineMembershipType(session);
          
          console.log(`Sending confirmation email to ${customerEmail} (${customerName}) for ${membershipType} membership`);
          
          // Send email with retry logic
          const emailResult = await sendConfirmationEmailWithRetry(
            customerEmail,
            customerName,
            membershipType
          );
          
          if (emailResult.success) {
            console.log(`✅ Confirmation email sent to ${customerEmail} after ${emailResult.attempts} attempt(s)`);
            console.log('Message ID:', emailResult.messageId);
          } else {
            console.error(`❌ Failed to send confirmation email after ${emailResult.attempts} attempts:`, emailResult.error);
          }
        } else {
          console.error('❌ No customer email could be extracted from the session');
        }
        break;
      }
      
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    // Return a success response
    console.log('🎉 Webhook processed successfully');
    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error(`❌ Webhook error: ${err.message}`);
    console.error('Error stack:', err.stack);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

export default webhookHandler; 