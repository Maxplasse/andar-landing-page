/**
 * Test script to verify webhook email sending
 */
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const crypto = require('crypto');
// Import the Brevo SDK
const SibApiV3Sdk = require('sib-api-v3-sdk');

// First, ensure DEBUG_WEBHOOK is true in the environment
process.env.DEBUG_WEBHOOK = 'true';

// Test brevo API directly to make sure it works
async function testDirectBrevoEmail() {
  console.log('\n=== TESTING DIRECT BREVO EMAIL ===');
  try {
    // Initialize the Brevo API client
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY || '';
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    
    // Create test email parameters
    const sender = {
      email: process.env.BREVO_SENDER_EMAIL || 'solene.legendre@polyarthrite-andar.com',
      name: process.env.BREVO_SENDER_NAME || 'ANDAR'
    };
    
    const recipients = [
      {
        email: 'm20plasse@gmail.com',
        name: 'Direct Test Recipient'
      }
    ];
    
    // Create the template email
    const templateEmail = new SibApiV3Sdk.SendSmtpEmail();
    templateEmail.templateId = 7;
    templateEmail.to = recipients;
    templateEmail.sender = sender;
    templateEmail.params = {
      name: 'Direct Test',
      membershipType: 'digital',
      date: new Date().toLocaleDateString('fr-FR'),
      membershipDetails: {
        name: "Test Digital",
        price: "10€",
        description: "Test direct Brevo API",
        duration: "1 an"
      }
    };
    
    console.log('Sending direct test email...');
    const result = await apiInstance.sendTransacEmail(templateEmail);
    
    console.log('✅ Direct email test successful!');
    console.log('Message ID:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Direct email test failed:', error.message);
    if (error.response) {
      console.error('API error details:', error.response.text);
    }
    return { success: false, error };
  }
}

async function testWebhook(endpoint) {
  console.log(`\n=== TESTING WEBHOOK EMAIL WITH: ${endpoint} ===`);
  console.log('Timestamp:', new Date().toISOString());
  
  // Create a mock checkout.session.completed event
  const mockEvent = {
    id: 'evt_' + crypto.randomBytes(16).toString('hex'),
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'cs_test_' + crypto.randomBytes(16).toString('hex'),
        object: 'checkout.session',
        customer: 'cus_' + crypto.randomBytes(16).toString('hex'),
        customer_details: {
          email: 'm20plasse@gmail.com',
          name: 'Max Test Customer',
          phone: null,
          tax_exempt: 'none',
          tax_ids: []
        },
        amount_total: 2500,
        currency: 'eur',
        metadata: {
          membershipType: 'classic'
        },
        payment_status: 'paid',
        status: 'complete',
        mode: 'payment'
      }
    },
    type: 'checkout.session.completed'
  };
  
  try {
    console.log('Sending request to webhook...');
    console.log('Mock event type:', mockEvent.type);
    console.log('Customer email:', mockEvent.data.object.customer_details.email);
    console.log('Membership type:', mockEvent.data.object.metadata.membershipType);
    
    // In debug mode, when DEBUG_WEBHOOK=true, we don't need a signature header for testing
    const response = await axios.post(`http://localhost:3000/api/${endpoint}?debug=true&email_test=true`, 
      mockEvent,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 second timeout to allow email processing
      }
    );
    
    console.log('\nWebhook response status:', response.status);
    console.log('Webhook response:', response.data);
    
    // Check if the webhook actually sent an email
    if (response.data && response.data.email_sent) {
      console.log('✅ Email was sent successfully by the webhook!');
      console.log('Email details:', response.data.email_details);
    } else {
      console.log('⚠️ Webhook responded with 200 OK but did not confirm email was sent.');
      console.log('Check server logs for more details.');
    }
    
    console.log(`\n✅ Test of ${endpoint} completed`);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    console.error(`\n❌ Error testing ${endpoint}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      return { success: false, status: error.response.status, error: error.response.data };
    }
    return { success: false, error: error.message };
  }
}

async function checkEnvironmentVariables() {
  console.log('Checking environment variables:');
  console.log('- DEBUG_WEBHOOK:', process.env.DEBUG_WEBHOOK);
  console.log('- BREVO_API_KEY exists:', Boolean(process.env.BREVO_API_KEY));
  console.log('- BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL);
  console.log('- STRIPE_SECRET_KEY exists:', Boolean(process.env.STRIPE_SECRET_KEY));
  console.log('- STRIPE_CLI_WEBHOOK_SECRET exists:', Boolean(process.env.STRIPE_CLI_WEBHOOK_SECRET));
  
  // Check if essential variables are missing
  const missingVars = [];
  if (!process.env.BREVO_API_KEY) missingVars.push('BREVO_API_KEY');
  if (!process.env.BREVO_SENDER_EMAIL) missingVars.push('BREVO_SENDER_EMAIL');
  if (!process.env.STRIPE_SECRET_KEY) missingVars.push('STRIPE_SECRET_KEY');
  
  if (missingVars.length > 0) {
    console.error('⚠️ Missing essential environment variables:', missingVars.join(', '));
    return false;
  }
  
  console.log('✅ All essential environment variables present');
  return true;
}

async function runAllTests() {
  // Check environment variables first
  console.log('=== ENVIRONMENT CHECK ===');
  const envOk = await checkEnvironmentVariables();
  if (!envOk) {
    console.log('⚠️ Environment variables are missing. This may cause the tests to fail.');
  }
  
  // First test direct Brevo email to verify API is working
  const directEmailResult = await testDirectBrevoEmail();
  
  if (!directEmailResult.success) {
    console.error('\n❌ Direct Brevo email failed. Testing webhooks would be pointless.');
    console.error('Please fix the Brevo API issues first.');
    return;
  }
  
  // Test the enhanced webhook first
  console.log('\n=== TESTING ENHANCED WEBHOOK WITH EMAIL SENDING ===');
  const enhancedResult = await testWebhook('webhook-enhanced');
  
  // For comparison, test regular webhook
  console.log('\n=== TESTING REGULAR WEBHOOK WITH EMAIL SENDING ===');
  const regularResult = await testWebhook('webhook');
  
  // Compare results
  console.log('\n=== TEST RESULTS SUMMARY ===');
  console.log('Direct Brevo API:', directEmailResult.success ? '✅ PASSED' : '❌ FAILED');
  console.log('Enhanced webhook:', enhancedResult.success ? '✅ PASSED' : '❌ FAILED');
  console.log('Regular webhook:', regularResult.success ? '✅ PASSED' : '❌ FAILED');
  
  // Provide a thorough diagnosis
  console.log('\n=== DIAGNOSIS ===');
  if (directEmailResult.success) {
    console.log('✓ Brevo API and credentials are working correctly');
  } else {
    console.log('✗ There are issues with the Brevo API or credentials');
  }
  
  if (enhancedResult.success) {
    console.log('✓ Enhanced webhook responds with 200 OK');
    
    // Check if it confirmed sending an email
    const emailSent = enhancedResult.data && enhancedResult.data.email_sent;
    
    if (emailSent) {
      console.log('✓ Enhanced webhook confirmed email sending');
    } else {
      console.log('✗ Enhanced webhook did not confirm email sending');
    }
  } else {
    console.log('✗ Enhanced webhook failed to respond correctly');
  }
  
  if (regularResult.success) {
    console.log('✓ Regular webhook responds with 200 OK');
    
    // Check if it confirmed sending an email
    const emailSent = regularResult.data && regularResult.data.email_sent;
    
    if (emailSent) {
      console.log('✓ Regular webhook confirmed email sending');
    } else {
      console.log('✗ Regular webhook did not confirm email sending');
    }
  } else {
    console.log('✗ Regular webhook failed to respond correctly');
  }
  
  // Final conclusion
  console.log('\n=== CONCLUSION ===');
  if (directEmailResult.success && enhancedResult.success && enhancedResult.data && enhancedResult.data.email_sent) {
    console.log('✅ SUCCESS: The enhanced webhook successfully sent an email!');
    console.log('\nRecommendations:');
    console.log('1. Replace your current webhook handler with the enhanced version');
    console.log('2. Ensure you only have one Stripe CLI listener running at a time');
    console.log('3. Monitor your Next.js server logs to ensure emails are sending correctly');
  } else if (directEmailResult.success && enhancedResult.success) {
    console.log('⚠️ PARTIAL SUCCESS: The enhanced webhook responded correctly but did not confirm email sending.');
    console.log('\nRecommendations:');
    console.log('1. Check your Next.js server logs for detailed errors');
    console.log('2. Verify the Stripe session data contains the expected fields');
    console.log('3. Try with a real Stripe checkout session instead of a mock');
  } else {
    console.log('❌ ISSUE DETECTED: There are problems with either the Brevo API or the webhook handlers.');
    console.log('\nRecommendations:');
    console.log('1. Check for detailed error messages in the tests above');
    console.log('2. Verify all environment variables are set correctly');
    console.log('3. Check your Next.js server for more detailed logs');
  }
}

// Run all the tests
runAllTests().then(() => {
  console.log('\nAll tests completed.');
}); 