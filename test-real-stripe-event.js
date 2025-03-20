/**
 * Script to test with a real Stripe event and a properly signed request.
 */
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const Stripe = require('stripe');

// Initialize Stripe client
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecretKey);

// For signature verification (used by the CLI)
const webhookSecret = process.env.STRIPE_CLI_WEBHOOK_SECRET;

async function testWithRealStripeEvent() {
  console.log('=== TESTING WITH REAL STRIPE EVENT ===');
  console.log('STRIPE_CLI_WEBHOOK_SECRET set:', Boolean(process.env.STRIPE_CLI_WEBHOOK_SECRET));
  console.log('USE_STRIPE_CLI env variable:', process.env.USE_STRIPE_CLI);
  console.log('DEBUG_WEBHOOK env variable:', process.env.DEBUG_WEBHOOK);
  
  try {
    // Fetch a recent checkout session from Stripe
    console.log('\nFetching recent checkout sessions from Stripe...');
    const sessions = await stripe.checkout.sessions.list({
      limit: 1,
      expand: ['data.customer'],
    });
    
    if (sessions.data.length === 0) {
      console.error('❌ No checkout sessions found in Stripe account.');
      return;
    }
    
    const recentSession = sessions.data[0];
    console.log(`Found checkout session: ${recentSession.id}`);
    console.log('Status:', recentSession.status);
    console.log('Created:', new Date(recentSession.created * 1000).toISOString());
    
    // Create a simulated checkout.session.completed event
    const simulatedEvent = {
      id: `evt_simulated_${Math.floor(Math.random() * 10000)}`,
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      type: 'checkout.session.completed',
      data: {
        object: recentSession
      }
    };
    
    // Convert to string for proper formatting
    const payload = JSON.stringify(simulatedEvent);
    
    console.log('\nSending simulated event with real session data...');
    console.log('Customer info in payload:');
    
    if (recentSession.customer_details) {
      if (recentSession.customer_details.email) {
        console.log(`- Email: ${recentSession.customer_details.email}`);
      }
      if (recentSession.customer_details.name) {
        console.log(`- Name: ${recentSession.customer_details.name}`);
      }
    }
    
    // Test with both approaches
    
    // Test 1: Debug mode
    console.log('\n1️⃣ TESTING WITH DEBUG MODE:');
    try {
      const debugResponse = await axios.post('http://localhost:3000/api/webhook', payload, {
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'dummy_signature_for_debug_mode'
        }
      });
      
      console.log('✅ Debug mode test successful!');
      console.log('Response status:', debugResponse.status);
      console.log('Response data:', debugResponse.data);
    } catch (error) {
      console.error('❌ Debug mode test failed!');
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Error message:', error.response.data);
      } else {
        console.error('Error:', error.message);
      }
    }
    
    // Test 2: Add the webhook endpoint as a test webhook endpoint in your Stripe account
    console.log('\n2️⃣ TESTING BY TRIGGERING REAL CHECKOUT SESSION:');
    console.log('For this test, make sure the Stripe CLI listener is running:');
    console.log('stripe listen --forward-to http://localhost:3000/api/webhook');
    console.log('\nTriggering a test checkout session with the Stripe CLI...');
    console.log('Note: This is an informational message, you need to manually run:');
    console.log('stripe trigger checkout.session.completed');
    
    console.log('\nCheck your Next.js server logs for webhook processing details.');
    console.log('Also check your email to see if the confirmation email was received.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testWithRealStripeEvent(); 