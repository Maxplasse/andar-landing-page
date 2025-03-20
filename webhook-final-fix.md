# Final Webhook Solution

Based on all our testing, we've confirmed that the issue is not with:

1. The Brevo API key - Direct email sending works
2. The template ID - Template emails are successfully sent
3. Webhook signature verification - Our tests bypass this and still work

The issue appears to be with how the production webhook handler:
1. Extracts the customer email
2. Handles errors during the process
3. Possibly timing out or failing silently

## Fix Steps

1. Replace your existing webhook handler (`pages/api/webhook.ts`) with this robust implementation:

```typescript
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

// Select appropriate Stripe keys based on environment
function getStripeKeys() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.DEBUG_WEBHOOK === 'true'
    ? process.env.STRIPE_CLI_WEBHOOK_SECRET
    : process.env.STRIPE_WEBHOOK_SECRET;
    
  return { secretKey, webhookSecret };
}

// Initialize Brevo API client with error handling
function initializeBrevoClient() {
  try {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    return new SibApiV3Sdk.TransactionalEmailsApi();
  } catch (error) {
    console.error('Error initializing Brevo API client:', error);
    throw error;
  }
}

// Send confirmation email with retry logic
async function sendConfirmationEmailWithRetry(email, name, membershipType, maxRetries = 3) {
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
      return { success: true, data: response };
    } catch (error) {
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
async function extractCustomerEmail(session, stripe) {
  console.log('Extracting customer email from session data...');
  
  // Try all the possible locations directly in the session
  let customerEmail = null;
  
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
  // Check receipt_email if available
  else if (session.receipt_email) {
    console.log('Found customer email in receipt_email:', session.receipt_email);
    customerEmail = session.receipt_email;
  }
  // Check metadata (sometimes custom implementations put it here)
  else if (session.metadata && session.metadata.email) {
    console.log('Found customer email in metadata:', session.metadata.email);
    customerEmail = session.metadata.email;
  }
  // Check if customer is an object with email
  else if (session.customer && typeof session.customer === 'object' && session.customer.email) {
    console.log('Found customer email in customer object:', session.customer.email);
    customerEmail = session.customer.email;
  }
  // If payment_intent is expanded and has receipt_email
  else if (session.payment_intent && typeof session.payment_intent === 'object') {
    if (session.payment_intent.receipt_email) {
      console.log('Found receipt_email in payment_intent:', session.payment_intent.receipt_email);
      customerEmail = session.payment_intent.receipt_email;
    }
  }
  
  // If no email found directly, try from customer ID if available
  if (!customerEmail && session.customer && typeof session.customer === 'string') {
    try {
      console.log('Looking up customer by ID:', session.customer);
      const customer = await stripe.customers.retrieve(session.customer);
      
      if (!customer.deleted && customer.email) {
        console.log('Found email from Stripe customer lookup:', customer.email);
        customerEmail = customer.email;
      }
    } catch (error) {
      console.error('Error retrieving customer:', error.message);
    }
  }
  
  if (!customerEmail) {
    console.error('Could not find a valid email address in the session data');
  }
  
  return customerEmail;
}

// Helper function for membership details
function getMembershipDetails(membershipType) {
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
function determineMembershipType(session) {
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
const webhookHandler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }
  
  const timestamp = new Date().toISOString();
  console.log(`=== WEBHOOK REQUEST RECEIVED AT ${timestamp} ===`);
  
  try {
    // Get Stripe keys
    const { secretKey, webhookSecret } = getStripeKeys();
    
    if (!secretKey) {
      console.error('Missing Stripe secret key');
      return res.status(500).send('Server configuration error');
    }
    
    // Initialize Stripe
    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
    
    // Get raw body for signature verification
    const rawBody = await buffer(req);
    
    // Process the event
    const sig = req.headers['stripe-signature'];
    const isDebugMode = process.env.DEBUG_WEBHOOK === 'true';
    let stripeEvent;
    
    if (isDebugMode && !sig) {
      console.log('DEBUG MODE: Bypassing signature verification');
      stripeEvent = JSON.parse(rawBody.toString());
    } else if (sig && webhookSecret) {
      try {
        stripeEvent = stripe.webhooks.constructEvent(rawBody.toString(), sig, webhookSecret);
        console.log('Webhook signature verified!');
      } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      console.error('Missing signature header or webhook secret');
      return res.status(400).send('Missing signature header or webhook secret');
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
        const customerName = session.customer_details?.name || 'Adhérent';
        
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
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error(`Error processing webhook: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

export default webhookHandler;
```

## Quick Test Procedure

1. Stop any existing Stripe CLI listeners:
   ```
   ps aux | grep "stripe listen" | grep -v grep
   kill [PID]  # Replace [PID] with the process IDs found
   ```

2. Start a fresh Stripe CLI listener:
   ```
   stripe listen --forward-to http://localhost:3000/api/webhook
   ```

3. Trigger a test event:
   ```
   stripe trigger checkout.session.completed
   ```

4. Check your Next.js server logs for detailed output.

## Production Deployment Checklist

1. Make sure these environment variables are set in your production environment:
   - `BREVO_API_KEY`
   - `BREVO_SENDER_EMAIL`
   - `BREVO_SENDER_NAME`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

2. Deploy the updated webhook handler to production.

3. Test a live purchase flow to verify the email is sent.

## Monitoring Suggestions

1. Add better server logging to capture any errors that occur during webhook processing.

2. Consider implementing a webhook monitoring system to track failed events.

3. Set up a periodic test script that:
   - Sends test purchases through your system
   - Verifies emails are received
   - Alerts you if anything fails

## Why This Fix Works

1. **Robust Email Extraction**: The new code handles all known patterns of email storage in Stripe session objects.

2. **Error Resilience**: Every operation has proper error handling and logging.

3. **Retry Logic**: The email sending has built-in retries with exponential backoff.

4. **Comprehensive Logging**: All steps are logged for better visibility into what's happening.

5. **Environment Awareness**: The code adapts based on whether it's running in debug or production mode. 