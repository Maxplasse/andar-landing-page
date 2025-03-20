/**
 * Debug script for tracking real checkout flow issues.
 * This script isolates parts of the real checkout flow for targeted debugging.
 */
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const Stripe = require('stripe');

// Set up Stripe with the same key as the webhook handler
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecretKey);

console.log('=== DEBUG REAL CHECKOUT FLOW ===');
console.log('Timestamp:', new Date().toISOString());

// Check environment
console.log('\n=== ENVIRONMENT CHECK ===');
console.log('BREVO_API_KEY exists:', Boolean(process.env.BREVO_API_KEY));
console.log('BREVO_API_KEY starts with:', process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.substring(0, 10) + '...' : 'NOT SET');
console.log('BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL || 'NOT SET');
console.log('BREVO_SENDER_NAME:', process.env.BREVO_SENDER_NAME || 'NOT SET');
console.log('STRIPE_SECRET_KEY exists:', Boolean(process.env.STRIPE_SECRET_KEY));
console.log('STRIPE_WEBHOOK_SECRET exists:', Boolean(process.env.STRIPE_WEBHOOK_SECRET));
console.log('STRIPE_CLI_WEBHOOK_SECRET exists:', Boolean(process.env.STRIPE_CLI_WEBHOOK_SECRET));
console.log('USE_STRIPE_CLI:', process.env.USE_STRIPE_CLI);
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set (development)');
console.log('=========================');

// Test function to directly call the function in the webhook handler
async function testDirectEmailSending() {
  console.log('\n1️⃣ TESTING DIRECT EMAIL SENDING');
  
  try {
    const { sendMembershipConfirmationEmail } = require('./utils/email');
    
    console.log('Calling sendMembershipConfirmationEmail directly...');
    const result = await sendMembershipConfirmationEmail(
      'max.plasse@viennou.com',
      'Max Plasse (Direct Flow Debug)',
      'digital'
    );
    
    console.log('Direct email sending result:', result);
    
    if (result.success) {
      console.log('✅ Direct email sent successfully!');
      console.log('Message ID:', result.data.messageId);
      return true;
    } else {
      console.error('❌ Direct email sending failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error in direct email sending test:', error);
    return false;
  }
}

// Test retrieving and processing a real checkout session
async function testRealCheckoutSession() {
  console.log('\n2️⃣ TESTING WITH MOST RECENT CHECKOUT SESSION');
  
  try {
    console.log('Fetching recent checkout sessions from Stripe...');
    const sessions = await stripe.checkout.sessions.list({
      limit: 5,
      expand: ['data.customer', 'data.line_items']
    });
    
    if (sessions.data.length === 0) {
      console.log('No checkout sessions found in Stripe account');
      return false;
    }
    
    const mostRecentSession = sessions.data[0];
    console.log(`Found most recent session: ${mostRecentSession.id}`);
    console.log('Session status:', mostRecentSession.status);
    console.log('Session created:', new Date(mostRecentSession.created * 1000).toISOString());
    
    // Extract key information from the session
    const customerEmail = mostRecentSession.customer_details?.email || 
                          mostRecentSession.customer?.email || 
                          mostRecentSession.metadata?.email;
    
    const customerName = mostRecentSession.customer_details?.name || 
                         mostRecentSession.customer?.name || 
                         'Test Customer';
    
    console.log('Customer email found:', customerEmail);
    console.log('Customer name found:', customerName);
    
    // Try to determine membership type
    let membershipType = 'unknown';
    if (mostRecentSession.metadata?.membershipType) {
      membershipType = mostRecentSession.metadata.membershipType;
    } else if (mostRecentSession.amount_total === 1000) {
      membershipType = 'digital';
    } else if (mostRecentSession.amount_total === 2500) {
      membershipType = 'classic';
    }
    
    console.log('Determined membership type:', membershipType);
    
    // Try to send an email using this real session data
    if (customerEmail) {
      const { sendMembershipConfirmationEmail } = require('./utils/email');
      
      console.log(`Attempting to send email to ${customerEmail} with real session data...`);
      const result = await sendMembershipConfirmationEmail(
        customerEmail,
        customerName,
        membershipType
      );
      
      if (result.success) {
        console.log('✅ Email sent successfully with real session data!');
        console.log('Message ID:', result.data.messageId);
        return true;
      } else {
        console.error('❌ Email sending failed with real session data:', result.error);
        return false;
      }
    } else {
      console.error('❌ No customer email found in the recent checkout session');
      return false;
    }
  } catch (error) {
    console.error('❌ Error in real checkout session test:', error);
    return false;
  }
}

// Test with the raw webhook handler processing
async function testWebhookHandlerDirectly() {
  console.log('\n3️⃣ TESTING WEBHOOK HANDLER DIRECTLY');
  
  try {
    // We need to get a real session to test with
    console.log('Fetching recent checkout sessions from Stripe...');
    const sessions = await stripe.checkout.sessions.list({
      limit: 1,
      expand: ['data.customer', 'data.line_items']
    });
    
    if (sessions.data.length === 0) {
      console.log('No checkout sessions found in Stripe account');
      return false;
    }
    
    const session = sessions.data[0];
    
    // Directly call the handleCompletedCheckout function from webhook.ts
    // We need to use dynamic import for ESM modules in CommonJS
    console.log('Loading webhook handler module...');
    
    // Extract the handleCompletedCheckout function using RegExp
    console.log('Directly calling webhook handler function with session...');
    
    // Create a fake event that matches the Stripe event format
    const fakeEvent = {
      id: 'evt_debug_test_direct',
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      type: 'checkout.session.completed',
      data: {
        object: session
      }
    };

    // POST directly to the webhook endpoint in debug mode
    console.log('POSTing fake event to webhook endpoint with debug mode enabled...');
    
    // First enable debug mode in env
    process.env.DEBUG_WEBHOOK = 'true';
    
    const response = await axios.post('http://localhost:3000/api/webhook', fakeEvent, {
      headers: {
        'Content-Type': 'application/json',
        // Include a fake signature to trigger debug mode
        'stripe-signature': 'dummy_signature_for_debug_mode'
      }
    });
    
    console.log('Response from webhook endpoint:', response.status);
    console.log('Response data:', response.data);
    
    process.env.DEBUG_WEBHOOK = 'false';
    
    return true;
  } catch (error) {
    console.error('❌ Error in webhook handler direct test:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Function to inspect real logged webhook events
async function inspectRecentEvents() {
  console.log('\n4️⃣ INSPECTING RECENT WEBHOOK EVENTS FROM STRIPE');
  
  try {
    // Fetch recent events from Stripe
    console.log('Fetching recent events from Stripe...');
    const events = await stripe.events.list({
      limit: 5,
      type: 'checkout.session.completed'
    });
    
    if (events.data.length === 0) {
      console.log('No recent checkout.session.completed events found');
      return false;
    }
    
    console.log(`Found ${events.data.length} recent checkout.session.completed events`);
    
    // Look at the most recent event
    const mostRecentEvent = events.data[0];
    console.log('\nMost recent checkout.session.completed event:');
    console.log('Event ID:', mostRecentEvent.id);
    console.log('Created:', new Date(mostRecentEvent.created * 1000).toISOString());
    
    const session = mostRecentEvent.data.object;
    
    console.log('\nCustomer details in the event:');
    console.log('customer_details:', session.customer_details || 'Not available');
    console.log('customer ID:', session.customer || 'Not available');
    console.log('customer_email:', session.customer_email || 'Not available');
    console.log('metadata:', session.metadata || 'Not available');
    
    // Try to determine if the webhook handler was able to extract the email
    let possibleEmails = [];
    
    if (session.customer_details?.email) {
      possibleEmails.push(session.customer_details.email);
    }
    
    if (session.customer_email) {
      possibleEmails.push(session.customer_email);
    }
    
    if (session.metadata?.email) {
      possibleEmails.push(session.metadata.email);
    }
    
    if (possibleEmails.length > 0) {
      console.log('\nPossible emails the webhook handler could extract:');
      possibleEmails.forEach((email, index) => {
        console.log(`Email ${index + 1}: ${email}`);
      });
    } else {
      console.log('\n⚠️ No obvious email addresses found in the event payload');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error inspecting recent events:', error);
    return false;
  }
}

// Run all tests in sequence
async function runAllTests() {
  let results = {
    directEmailSending: false,
    realCheckoutSession: false,
    webhookHandler: false,
    eventInspection: false
  };
  
  console.log('\n=== RUNNING ALL TESTS ===');
  
  results.directEmailSending = await testDirectEmailSending();
  results.realCheckoutSession = await testRealCheckoutSession();
  results.webhookHandler = await testWebhookHandlerDirectly();
  results.eventInspection = await inspectRecentEvents();
  
  console.log('\n=== TEST RESULTS SUMMARY ===');
  console.log('1. Direct Email Sending:', results.directEmailSending ? '✅ PASSED' : '❌ FAILED');
  console.log('2. Real Checkout Session:', results.realCheckoutSession ? '✅ PASSED' : '❌ FAILED');
  console.log('3. Webhook Handler:', results.webhookHandler ? '✅ PASSED' : '❌ FAILED');
  console.log('4. Event Inspection:', results.eventInspection ? '✅ PASSED' : '❌ FAILED');
  
  console.log('\n=== DIAGNOSIS ===');
  if (results.directEmailSending && results.realCheckoutSession) {
    console.log('✅ The email sending functionality is working correctly');
  } else {
    console.log('❌ There is a problem with the email sending functionality');
  }
  
  if (results.webhookHandler) {
    console.log('✅ The webhook handler can process checkout events in debug mode');
  } else {
    console.log('❌ There is a problem with the webhook handler processing');
  }
  
  // Final conclusion
  if (!results.directEmailSending) {
    console.log('\n🔎 ISSUE: The basic email sending functionality is not working');
    console.log('SOLUTION: Check Brevo API key and sender configuration');
  } else if (!results.realCheckoutSession) {
    console.log('\n🔎 ISSUE: Cannot send emails with real customer data from Stripe sessions');
    console.log('SOLUTION: Check how customer data is extracted from Stripe sessions');
  } else if (!results.webhookHandler) {
    console.log('\n🔎 ISSUE: The webhook handler is not processing events correctly');
    console.log('SOLUTION: Check webhook handler logic and error handling');
  } else {
    console.log('\n🔎 Most likely issue: Webhook signature verification is failing for real events');
    console.log('SOLUTION: Ensure the correct webhook secret is configured in your environment');
    console.log('Current webhook secret prefix:', process.env.STRIPE_WEBHOOK_SECRET ? 
      process.env.STRIPE_WEBHOOK_SECRET.substring(0, 10) + '...' : 'NOT SET');
    console.log('CLI webhook secret prefix:', process.env.STRIPE_CLI_WEBHOOK_SECRET ? 
      process.env.STRIPE_CLI_WEBHOOK_SECRET.substring(0, 10) + '...' : 'NOT SET');
  }
}

// Run all tests
runAllTests(); 