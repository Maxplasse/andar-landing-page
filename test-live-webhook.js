require('dotenv').config({ path: '.env.local' });
const express = require('express');
const bodyParser = require('body-parser');
const Stripe = require('stripe');
const SibApiV3Sdk = require('sib-api-v3-sdk');

// Initialize Express app
const app = express();
const PORT = 3333;

// Store for webhook events for analysis
const webhookEvents = [];

// Initialize the Brevo API client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Configure Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_CLI_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

// Middleware to parse raw body for Stripe webhook
app.use('/webhook', (req, res, next) => {
  let rawBody = '';
  req.on('data', (chunk) => {
    rawBody += chunk.toString();
  });
  
  req.on('end', () => {
    req.rawBody = rawBody;
    next();
  });
});

// Regular body parser for other routes
app.use(bodyParser.json());

// Helper function for email sending
async function sendConfirmationEmail(email, name, membershipType) {
  console.log(`\n📧 SENDING EMAIL TO ${email}`);
  console.log(`Name: ${name}`);
  console.log(`Type: ${membershipType}`);
  
  try {
    // Create sender info
    const sender = {
      email: process.env.BREVO_SENDER_EMAIL || 'solene.legendre@polyarthrite-andar.com',
      name: process.env.BREVO_SENDER_NAME || 'ANDAR'
    };
    
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
      membershipDetails: getMembershipDetails(membershipType)
    };
    templateEmail.sender = sender;
    
    // Send the email
    console.log('Sending template email...');
    const response = await apiInstance.sendTransacEmail(templateEmail);
    
    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log('Message ID:', response.messageId);
    return { success: true, messageId: response.messageId };
  } catch (error) {
    console.error('❌ ERROR SENDING EMAIL:', error);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error details:', error.response.text || error.response.data);
    }
    return { success: false, error };
  }
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

// Extract customer email with lots of logging
async function extractCustomerEmail(session) {
  console.log('Extracting customer email from session data...');
  console.log('Session ID:', session.id);
  
  console.log('Looking for email in standard fields:');
  
  // Try all the possible locations directly in the session
  const locations = [
    { source: 'customer_details.email', value: session.customer_details?.email },
    { source: 'customer_email', value: session.customer_email },
    { source: 'metadata.email', value: session.metadata?.email }
  ];
  
  // Add receipt_email with type assertion check
  if (session.receipt_email !== undefined) {
    locations.push({ source: 'receipt_email', value: session.receipt_email });
  }
  
  // Check if customer is an object with email
  if (session.customer && typeof session.customer === 'object' && 'email' in session.customer) {
    locations.push({ source: 'customer object', value: session.customer.email });
  }
  
  // Check if payment_intent is an object with receipt_email
  if (session.payment_intent && typeof session.payment_intent === 'object') {
    if (session.payment_intent.receipt_email !== undefined) {
      locations.push({ source: 'payment_intent.receipt_email', value: session.payment_intent.receipt_email });
    }
  }
  
  // Check client_reference_id if it looks like an email
  if (session.client_reference_id && session.client_reference_id.includes('@')) {
    locations.push({ source: 'client_reference_id', value: session.client_reference_id });
  }
  
  // Log all found locations
  console.log('Email locations found:');
  locations.forEach(loc => {
    console.log(`- ${loc.source}: ${loc.value || 'not found'}`);
  });
  
  // Find the first valid email
  const emailLocation = locations.find(loc => loc.value);
  
  if (emailLocation) {
    console.log(`✅ Found customer email in ${emailLocation.source}: ${emailLocation.value}`);
    return emailLocation.value;
  }
  
  // If no email found directly, try from customer ID if available
  if (session.customer && typeof session.customer === 'string') {
    try {
      console.log(`Looking up customer by ID: ${session.customer}`);
      const customer = await stripe.customers.retrieve(session.customer);
      
      if (!customer.deleted && customer.email) {
        console.log(`✅ Found email from Stripe customer lookup: ${customer.email}`);
        return customer.email;
      }
    } catch (error) {
      console.error('Error retrieving customer:', error.message);
    }
  }
  
  console.log('❌ Could not find a valid email address in the session data');
  return null;
}

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n=== WEBHOOK REQUEST RECEIVED ${timestamp} ===`);
  
  // Store event data
  const event = {
    timestamp,
    headers: req.headers,
    rawBody: req.rawBody,
    body: null,
    processing: {}
  };
  
  try {
    // Verify signature if not in debug mode
    const sig = req.headers['stripe-signature'];
    console.log('Stripe signature:', sig ? sig.substring(0, 20) + '...' : 'MISSING');
    
    let stripeEvent;
    const isDebugMode = process.env.DEBUG_WEBHOOK === 'true';
    
    if (isDebugMode) {
      console.log('🔍 DEBUG MODE: Bypassing signature verification');
      stripeEvent = JSON.parse(req.rawBody);
    } else if (sig && webhookSecret) {
      console.log('Verifying webhook signature...');
      try {
        stripeEvent = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
        console.log('✅ Webhook signature verified!');
      } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        event.processing.signatureError = err.message;
        webhookEvents.push(event);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      console.error('Missing signature header or webhook secret');
      event.processing.error = 'Missing signature header or webhook secret';
      webhookEvents.push(event);
      return res.status(400).send('Missing signature header or webhook secret');
    }
    
    // Store parsed body
    event.body = stripeEvent;
    
    // Process event based on type
    console.log(`Event type: ${stripeEvent.type}`);
    console.log(`Event ID: ${stripeEvent.id}`);
    
    event.processing.eventType = stripeEvent.type;
    
    if (stripeEvent.type === 'checkout.session.completed') {
      console.log('Processing checkout.session.completed event...');
      event.processing.handling = 'checkout.session.completed';
      
      const session = stripeEvent.data.object;
      
      // Log detailed session info
      console.log('Session ID:', session.id);
      console.log('Customer:', session.customer);
      console.log('Customer details present:', Boolean(session.customer_details));
      if (session.customer_details) {
        console.log('Customer email from details:', session.customer_details.email);
        console.log('Customer name from details:', session.customer_details.name);
      }
      console.log('Metadata present:', Boolean(session.metadata));
      if (session.metadata) {
        console.log('Metadata:', JSON.stringify(session.metadata));
      }
      
      // Extract email
      const customerEmail = await extractCustomerEmail(session);
      event.processing.extractedEmail = customerEmail;
      
      if (customerEmail) {
        // Get customer name
        const customerName = session.customer_details?.name || 'Adhérent';
        event.processing.customerName = customerName;
        
        // Determine membership type
        let membershipType = 'digital';
        if (session.metadata?.membershipType) {
          membershipType = session.metadata.membershipType;
        } else if (session.amount_total) {
          if (session.amount_total === 1000) membershipType = 'digital';
          else if (session.amount_total === 2500) membershipType = 'classic';
          else if (session.amount_total >= 5000) membershipType = 'premium';
        }
        event.processing.membershipType = membershipType;
        
        // Send email
        console.log(`Sending confirmation email to ${customerEmail}`);
        const emailResult = await sendConfirmationEmail(
          customerEmail,
          customerName,
          membershipType
        );
        
        event.processing.emailSent = emailResult.success;
        event.processing.emailDetails = emailResult;
        
        if (emailResult.success) {
          console.log('✅ Confirmation email sent successfully!');
        } else {
          console.error('❌ Failed to send confirmation email:', emailResult.error);
        }
      } else {
        console.error('❌ Could not extract customer email, skipping email sending');
        event.processing.error = 'Could not extract customer email';
      }
    } else {
      console.log(`Ignoring event type: ${stripeEvent.type}`);
      event.processing.handling = 'ignored';
    }
    
    // Store event for analysis
    webhookEvents.push(event);
    
    // Return success
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌ Error processing webhook:', err);
    event.processing.error = err.message;
    webhookEvents.push(event);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'alive',
    webhookEventsReceived: webhookEvents.length,
    brevoApiKey: process.env.BREVO_API_KEY ? `${process.env.BREVO_API_KEY.substring(0, 5)}...` : 'NOT SET',
    webhookSecret: webhookSecret ? `${webhookSecret.substring(0, 5)}...` : 'NOT SET',
    env: {
      DEBUG_WEBHOOK: process.env.DEBUG_WEBHOOK,
      NODE_ENV: process.env.NODE_ENV
    }
  });
});

// Stats endpoint
app.get('/stats', (req, res) => {
  const simplifiedEvents = webhookEvents.map(event => ({
    timestamp: event.timestamp,
    type: event.body?.type || 'unknown',
    id: event.body?.id || 'unknown',
    signaturePresent: Boolean(event.headers['stripe-signature']),
    processing: event.processing
  }));
  
  res.json(simplifiedEvents);
});

// Start the server
app.listen(PORT, () => {
  console.log(`\n=== WEBHOOK TEST SERVER STARTED ===`);
  console.log(`Listening on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`Status URL: http://localhost:${PORT}/status`);
  console.log(`Stats URL: http://localhost:${PORT}/stats`);
  console.log('\nEnvironment:');
  console.log(`DEBUG_WEBHOOK: ${process.env.DEBUG_WEBHOOK || 'not set'}`);
  console.log(`BREVO_API_KEY: ${process.env.BREVO_API_KEY ? 'present' : 'missing'}`);
  console.log(`BREVO_SENDER_EMAIL: ${process.env.BREVO_SENDER_EMAIL || 'not set'}`);
  console.log(`WEBHOOK_SECRET: ${webhookSecret ? 'present' : 'missing'}`);
  
  console.log('\nReady to receive webhook events. Use Stripe CLI to test:');
  console.log(`stripe listen --forward-to http://localhost:${PORT}/webhook`);
  console.log('Then trigger an event:');
  console.log('stripe trigger checkout.session.completed');
}); 