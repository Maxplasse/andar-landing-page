/**
 * Debug Webhook Flow - A comprehensive testing script for Stripe/Brevo integration
 */
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const SibApiV3Sdk = require('sib-api-v3-sdk');

// Log environment variables
console.log('=== ENVIRONMENT CHECK ===');
console.log('BREVO_API_KEY exists:', Boolean(process.env.BREVO_API_KEY));
if (process.env.BREVO_API_KEY) {
  console.log('BREVO_API_KEY prefix:', process.env.BREVO_API_KEY.substring(0, 10) + '...');
}
console.log('BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL || 'Not set');
console.log('BREVO_SENDER_NAME:', process.env.BREVO_SENDER_NAME || 'Not set');
console.log('STRIPE_SECRET_KEY exists:', Boolean(process.env.STRIPE_SECRET_KEY));
console.log('STRIPE_WEBHOOK_SECRET exists:', Boolean(process.env.STRIPE_WEBHOOK_SECRET));
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('=========================\n');

// Step 1: Test direct email sending with Brevo
console.log('STEP 1: Testing direct email sending with Brevo API');
async function testBrevoDirectly() {
  try {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    console.log('Initializing Brevo API client');
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    sendSmtpEmail.to = [{
      email: 'max.plasse@viennou.com',
      name: 'Max Plasse (Direct Test)',
    }];
    
    sendSmtpEmail.templateId = 1; // Membership confirmation template
    sendSmtpEmail.params = {
      name: 'Max Plasse',
      membershipType: 'digital',
      date: new Date().toLocaleDateString('fr-FR'),
      membershipDetails: {
        name: 'Adhésion Numérique',
        price: '10€',
        description: 'Accès à tous les services numériques ANDAR',
        duration: '1 an',
      }
    };
    
    sendSmtpEmail.sender = {
      email: process.env.BREVO_SENDER_EMAIL || 'notifications@andar.fr',
      name: process.env.BREVO_SENDER_NAME || 'ANDAR',
    };
    
    console.log('Sending direct email with Brevo...');
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Direct email sent successfully!');
    console.log('Result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error sending direct email with Brevo:', error);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data || error.response.text || error.response.body);
    }
    throw error;
  }
}

// Step 2: Test via API route
console.log('\nSTEP 2: Testing email sending via API route');
async function testViaApiRoute() {
  try {
    console.log('Calling test-webhook API route...');
    const response = await axios.post('http://localhost:3000/api/test-webhook', {
      email: 'max.plasse@viennou.com',
      name: 'Max Plasse (API Test)',
      membershipType: 'digital'
    });
    
    console.log('✅ API route test completed!');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error testing via API route:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Step 3: Test with direct webhook payload
console.log('\nSTEP 3: Testing webhook endpoint with simulated Stripe payload');
async function testWebhookWithPayload() {
  try {
    // Create a simulated Stripe checkout.session.completed event
    const payload = {
      id: 'evt_test_webhook_direct',
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_simulated',
          object: 'checkout.session',
          customer: 'cus_test_direct',
          customer_details: {
            email: 'max.plasse@viennou.com',
            name: 'Max Plasse (Direct Webhook Test)'
          },
          amount_total: 1000, // 10 EUR in cents for digital membership
          // Include metadata to be absolutely sure
          metadata: {
            membershipType: 'digital',
            email: 'max.plasse@viennou.com'
          }
        }
      }
    };
    
    console.log('Sending simulated webhook payload to webhook endpoint...');
    console.log('Direct webhook payload:', JSON.stringify(payload, null, 2));
    
    // Send directly to the webhook endpoint
    const response = await axios.post('http://localhost:3000/api/webhook', payload, {
      headers: {
        'Content-Type': 'application/json',
        // Include a dummy signature so the debug mode can be triggered
        'stripe-signature': 'dummy_signature_for_debug_mode'
      }
    });
    
    console.log('✅ Direct webhook test completed!');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error testing direct webhook:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Run all tests
async function runTests() {
  try {
    // Step 1: Test direct email sending
    await testBrevoDirectly();
    console.log('\n✓ Step 1 completed successfully\n');
    
    // Step 2: Test via API route
    await testViaApiRoute();
    console.log('\n✓ Step 2 completed successfully\n');
    
    // Step 3: Test direct webhook payload
    await testWebhookWithPayload();
    console.log('\n✓ Step 3 completed successfully\n');
    
    console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY ===');
    console.log('This confirms that your Brevo integration is working correctly.');
    console.log('If you\'re still having issues with Stripe webhooks, the problem is likely with:');
    console.log('1. The Stripe webhook configuration and not the email sending functionality.');
    console.log('2. The Stripe signature verification process in your webhook handler.');
    console.log('3. The data format coming from the Stripe webhook.');
    console.log('\nRecommendation: Check your Next.js server logs when a Stripe webhook is received.');
  } catch (error) {
    console.error('\n❌ Some tests failed. See errors above for details.');
    process.exit(1);
  }
}

// Execute the tests
runTests(); 