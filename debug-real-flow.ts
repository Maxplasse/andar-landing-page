/**
 * Debug script for tracking real checkout flow issues (TypeScript version).
 * This script isolates parts of the real checkout flow for targeted debugging.
 */
import { config } from 'dotenv';
import axios from 'axios';
import Stripe from 'stripe';
import { sendMembershipConfirmationEmail } from './utils/email';

// Load environment variables
config({ path: '.env.local' });

// Set up Stripe with the same key as the webhook handler
const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string;
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia',
});

console.log('=== DEBUG REAL CHECKOUT FLOW (TS) ===');
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

// Test function to directly call the email sending function
async function testDirectEmailSending(): Promise<boolean> {
  console.log('\n1️⃣ TESTING DIRECT EMAIL SENDING');
  
  try {
    console.log('Calling sendMembershipConfirmationEmail directly...');
    const result = await sendMembershipConfirmationEmail(
      'max.plasse@viennou.com',
      'Max Plasse (Direct Flow Debug TS)',
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
async function testRealCheckoutSession(): Promise<boolean> {
  console.log('\n2️⃣ TESTING WITH MOST RECENT CHECKOUT SESSION');
  
  try {
    console.log('Fetching recent checkout sessions from Stripe...');
    const sessions = await stripe.checkout.sessions.list({
      limit: 5,
      expand: ['data.customer', 'data.line_items'],
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
    let customerEmail: string | undefined;
    
    if (typeof mostRecentSession.customer_details?.email === 'string') {
      customerEmail = mostRecentSession.customer_details.email;
    } else if (
      mostRecentSession.customer && 
      typeof mostRecentSession.customer !== 'string' &&
      'email' in mostRecentSession.customer && 
      typeof mostRecentSession.customer.email === 'string'
    ) {
      customerEmail = mostRecentSession.customer.email;
    } else if (
      mostRecentSession.metadata && 
      'email' in mostRecentSession.metadata && 
      typeof mostRecentSession.metadata.email === 'string'
    ) {
      customerEmail = mostRecentSession.metadata.email;
    }
    
    // Get customer name
    let customerName = 'Test Customer';
    if (
      mostRecentSession.customer_details && 
      'name' in mostRecentSession.customer_details && 
      typeof mostRecentSession.customer_details.name === 'string'
    ) {
      customerName = mostRecentSession.customer_details.name;
    }
    
    console.log('Customer email found:', customerEmail);
    console.log('Customer name found:', customerName);
    
    // Try to determine membership type
    let membershipType = 'unknown';
    if (
      mostRecentSession.metadata && 
      'membershipType' in mostRecentSession.metadata && 
      typeof mostRecentSession.metadata.membershipType === 'string'
    ) {
      membershipType = mostRecentSession.metadata.membershipType;
    } else if (mostRecentSession.amount_total === 1000) {
      membershipType = 'digital';
    } else if (mostRecentSession.amount_total === 2500) {
      membershipType = 'classic';
    }
    
    console.log('Determined membership type:', membershipType);
    
    // Try to send an email using this real session data
    if (customerEmail) {
      console.log(`Attempting to send email to ${customerEmail} with real session data...`);
      
      try {
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
      } catch (emailError) {
        console.error('❌ Error sending email with real session data:', emailError);
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

// Test with the webhook handler directly
async function testWebhookHandlerDirectly(): Promise<boolean> {
  console.log('\n3️⃣ TESTING WEBHOOK HANDLER DIRECTLY');
  
  try {
    // We need to get a real session to test with
    console.log('Fetching recent checkout sessions from Stripe...');
    const sessions = await stripe.checkout.sessions.list({
      limit: 5,
      expand: ['data.customer', 'data.line_items'],
      status: 'complete',
    });
    
    // Try to find a completed session
    const completedSession = sessions.data.find(session => session.status === 'complete');
    
    if (!completedSession) {
      console.log('No completed checkout sessions found in Stripe account');
      
      // If no completed session, try to find an open one
      const openSession = sessions.data.find(session => session.status === 'open');
      
      if (!openSession) {
        console.log('No open sessions found either. Cannot proceed with this test.');
        return false;
      }
      
      console.log('Using open session instead:', openSession.id);
      console.log('Session status:', openSession.status);
      console.log('Session created:', new Date(openSession.created * 1000).toISOString());
      
      // Create a fake event that matches the Stripe event format
      const fakeEvent = {
        id: 'evt_debug_test_direct',
        object: 'event',
        api_version: '2023-10-16',
        created: Math.floor(Date.now() / 1000),
        type: 'checkout.session.completed',
        data: {
          object: openSession
        }
      };
      
      // POST directly to the webhook endpoint in debug mode
      console.log('POSTing fake event with open session to webhook endpoint with debug mode enabled...');
      
      try {
        const response = await axios.post('http://localhost:3000/api/webhook', fakeEvent, {
          headers: {
            'Content-Type': 'application/json',
            'stripe-signature': 'dummy_signature_for_debug_mode'
          }
        });
        
        console.log('Response from webhook endpoint:', response.status);
        console.log('Response data:', response.data);
        
        return true;
      } catch (webhookError) {
        console.error('❌ Error posting to webhook endpoint:', webhookError);
        if (webhookError && typeof webhookError === 'object' && 'response' in webhookError &&
            webhookError.response && typeof webhookError.response === 'object') {
          if ('status' in webhookError.response) {
            console.error('Response status:', webhookError.response.status);
          }
          if ('data' in webhookError.response) {
            console.error('Response data:', webhookError.response.data);
          }
        }
        return false;
      }
    }
    
    console.log('Found completed session:', completedSession.id);
    console.log('Session status:', completedSession.status);
    console.log('Session created:', new Date(completedSession.created * 1000).toISOString());
    
    // Create a fake event that matches the Stripe event format
    const fakeEvent = {
      id: 'evt_debug_test_direct',
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      type: 'checkout.session.completed',
      data: {
        object: completedSession
      }
    };
    
    // POST directly to the webhook endpoint in debug mode
    console.log('POSTing fake event to webhook endpoint with debug mode enabled...');
    
    try {
      const response = await axios.post('http://localhost:3000/api/webhook', fakeEvent, {
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'dummy_signature_for_debug_mode'
        }
      });
      
      console.log('Response from webhook endpoint:', response.status);
      console.log('Response data:', response.data);
      
      return true;
    } catch (webhookError) {
      console.error('❌ Error posting to webhook endpoint:', webhookError);
      if (webhookError && typeof webhookError === 'object' && 'response' in webhookError &&
          webhookError.response && typeof webhookError.response === 'object') {
        if ('status' in webhookError.response) {
          console.error('Response status:', webhookError.response.status);
        }
        if ('data' in webhookError.response) {
          console.error('Response data:', webhookError.response.data);
        }
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Error in webhook handler direct test:', error);
    return false;
  }
}

// Function to inspect real logged webhook events
async function inspectRecentEvents(): Promise<boolean> {
  console.log('\n4️⃣ INSPECTING RECENT WEBHOOK EVENTS FROM STRIPE');
  
  try {
    // Fetch recent events from Stripe
    console.log('Fetching recent events from Stripe...');
    const events = await stripe.events.list({
      limit: 5,
      type: 'checkout.session.completed',
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
    
    const session = mostRecentEvent.data.object as Stripe.Checkout.Session;
    
    console.log('\nCustomer details in the event:');
    console.log('customer_details:', session.customer_details || 'Not available');
    console.log('customer ID:', session.customer || 'Not available');
    console.log('customer_email:', session.customer_email || 'Not available');
    console.log('metadata:', session.metadata || 'Not available');
    
    // Try to determine if the webhook handler was able to extract the email
    let possibleEmails: string[] = [];
    
    if (session.customer_details?.email) {
      possibleEmails.push(session.customer_details.email as string);
    }
    
    if (session.customer_email) {
      possibleEmails.push(session.customer_email as string);
    }
    
    if (session.metadata?.email) {
      possibleEmails.push(session.metadata.email as string);
    }
    
    if (possibleEmails.length > 0) {
      console.log('\nPossible emails the webhook handler could extract:');
      possibleEmails.forEach((email, index) => {
        console.log(`Email ${index + 1}: ${email}`);
      });
      
      // Try to send an email to the first email found
      console.log('\nAttempting to send a test email to:', possibleEmails[0]);
      try {
        const result = await sendMembershipConfirmationEmail(
          possibleEmails[0],
          'Real Event Customer',
          'digital'
        );
        
        if (result.success) {
          console.log('✅ Test email sent successfully to real customer email!');
          console.log('Message ID:', result.data.messageId);
        } else {
          console.error('❌ Failed to send test email to real customer:', result.error);
        }
      } catch (emailError) {
        console.error('❌ Error sending test email to real customer:', emailError);
      }
    } else {
      console.log('\n⚠️ No obvious email addresses found in the event payload');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error inspecting recent events:', error);
    return false;
  }
}

// Function to test actual webhook verification
async function testWebhookVerification(): Promise<boolean> {
  console.log('\n5️⃣ TESTING WEBHOOK SIGNATURE VERIFICATION');
  
  try {
    // Get webhook secrets
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const cliWebhookSecret = process.env.STRIPE_CLI_WEBHOOK_SECRET;
    
    console.log('Regular webhook secret prefix:', webhookSecret ? webhookSecret.substring(0, 10) + '...' : 'NOT SET');
    console.log('CLI webhook secret prefix:', cliWebhookSecret ? cliWebhookSecret.substring(0, 10) + '...' : 'NOT SET');
    
    // Create a simple test event
    const payload = {
      id: 'evt_test_webhook_verification',
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_verification',
          object: 'checkout.session',
          customer_details: {
            email: 'verify@example.com',
            name: 'Verification Test'
          },
          metadata: {
            membershipType: 'digital'
          }
        }
      }
    };
    
    // Convert to string as Stripe would
    const payloadString = JSON.stringify(payload);
    
    // Test with regular webhook secret
    if (webhookSecret) {
      console.log('\nTesting regular webhook secret:');
      
      // Create a fake signature (this will fail verification, which is expected)
      const timestamp = Math.floor(Date.now() / 1000);
      const fakeSignature = `t=${timestamp},v1=fake_signature`;
      
      try {
        const response = await axios.post('http://localhost:3000/api/webhook', payloadString, {
          headers: {
            'Content-Type': 'application/json',
            'stripe-signature': fakeSignature
          }
        });
        
        console.log('⚠️ Test webhook verification bypassed with fake signature!');
        console.log('This suggests signature verification might be bypassed');
      } catch (error) {
        console.log('Expected error with fake signature (this is good):');
        if (error && typeof error === 'object' && 'response' in error &&
            error.response && typeof error.response === 'object') {
          if ('status' in error.response) {
            console.log('Response status:', error.response.status);
          }
          if ('data' in error.response) {
            console.log('Error data:', error.response.data);
          }
        } else {
          console.log('Error:', error);
        }
      }
    }
    
    // Test with debug mode - this should succeed if debug mode is working
    console.log('\nTesting with debug mode:');
    process.env.DEBUG_WEBHOOK = 'true';
    
    try {
      const response = await axios.post('http://localhost:3000/api/webhook', payloadString, {
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'dummy_signature_for_debug_mode'
        }
      });
      
      console.log('Debug mode response:', response.status);
      console.log('Debug mode response data:', response.data);
      console.log('✅ Debug mode is working correctly');
    } catch (error) {
      console.error('❌ Debug mode failed:');
      if (error && typeof error === 'object') {
        console.error(error);
        if ('message' in error) {
          console.error('Error message:', error.message);
        }
      } else {
        console.error(error);
      }
      return false;
    }
    
    process.env.DEBUG_WEBHOOK = 'false';
    
    return true;
  } catch (error) {
    console.error('❌ Error in webhook verification test:');
    if (error && typeof error === 'object') {
      console.error(error);
      if ('message' in error) {
        console.error('Error message:', error.message);
      }
    } else {
      console.error(error);
    }
    return false;
  }
}

// Run all tests in sequence
async function runAllTests() {
  const results = {
    directEmailSending: false,
    realCheckoutSession: false,
    webhookHandler: false,
    eventInspection: false,
    webhookVerification: false
  };
  
  console.log('\n=== RUNNING ALL TESTS ===');
  
  results.directEmailSending = await testDirectEmailSending();
  results.realCheckoutSession = await testRealCheckoutSession();
  results.webhookHandler = await testWebhookHandlerDirectly();
  results.eventInspection = await inspectRecentEvents();
  results.webhookVerification = await testWebhookVerification();
  
  console.log('\n=== TEST RESULTS SUMMARY ===');
  console.log('1. Direct Email Sending:', results.directEmailSending ? '✅ PASSED' : '❌ FAILED');
  console.log('2. Real Checkout Session:', results.realCheckoutSession ? '✅ PASSED' : '❌ FAILED');
  console.log('3. Webhook Handler:', results.webhookHandler ? '✅ PASSED' : '❌ FAILED');
  console.log('4. Event Inspection:', results.eventInspection ? '✅ PASSED' : '❌ FAILED');
  console.log('5. Webhook Verification:', results.webhookVerification ? '✅ PASSED' : '❌ FAILED');
  
  console.log('\n=== DIAGNOSIS ===');
  if (results.directEmailSending) {
    console.log('✅ Basic email sending is working correctly');
  } else {
    console.log('❌ There is a problem with the basic email sending functionality');
  }
  
  if (results.webhookHandler) {
    console.log('✅ The webhook handler can process events in debug mode');
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
    console.log('SOLUTION RECOMMENDATION:');
    console.log('1. Make sure DEBUG_WEBHOOK=true is added to your .env.local file');
    console.log('2. Update the webhook handler to use the Stripe CLI webhook secret when in development mode');
    console.log('3. Set USE_STRIPE_CLI=true in your .env.local file');
    console.log('4. Double-check that your Stripe CLI is using the correct webhook secret');
  }
}

// Run all tests
runAllTests(); 