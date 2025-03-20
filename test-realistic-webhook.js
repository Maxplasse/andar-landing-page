/**
 * Test script to send a realistic Stripe checkout session with detailed customer data
 * to the webhook endpoint.
 */
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

// Log start
console.log('=== REALISTIC WEBHOOK TEST - STARTING ===');
console.log('Timestamp:', new Date().toISOString());
console.log('=== Creating simulated webhook payload with rich customer data ===');

// Create a more realistic Stripe checkout.session.completed event with all possible customer data fields
const createRealisticCheckoutPayload = () => {
  return {
    id: 'evt_test_realistic_webhook',
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_realistic_data',
        object: 'checkout.session',
        after_expiration: null,
        allow_promotion_codes: null,
        amount_subtotal: 1000,
        amount_total: 1000,
        automatic_tax: { enabled: false, status: null },
        billing_address_collection: null,
        cancel_url: 'https://example.com/cancel',
        client_reference_id: 'user_reference_123',
        consent: null,
        consent_collection: null,
        created: Math.floor(Date.now() / 1000) - 300, // 5 minutes ago
        currency: 'eur',
        custom_text: { shipping_address: null, submit: null },
        customer: 'cus_test_realistic',
        customer_creation: 'always',
        customer_details: {
          address: {
            city: 'Paris',
            country: 'FR',
            line1: '1 Rue de Rivoli',
            line2: null,
            postal_code: '75001',
            state: null
          },
          email: 'jean.dupont@example.com',
          name: 'Jean Dupont',
          phone: '+33612345678',
          tax_exempt: 'none',
          tax_ids: []
        },
        customer_email: 'jean.dupont@example.com',
        expires_at: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
        livemode: false,
        locale: 'fr',
        metadata: {
          orderReference: 'ORDER_REF_12345',
          email: 'metadata.jean@example.com',
          membershipType: 'digital'
        },
        mode: 'payment',
        payment_intent: 'pi_test_payment_intent',
        payment_method_options: {},
        payment_method_types: ['card'],
        payment_status: 'paid',
        phone_number_collection: { enabled: false },
        recovered_from: null,
        setup_intent: null,
        shipping_address_collection: null,
        shipping_cost: null,
        shipping_details: null,
        shipping_options: [],
        status: 'complete',
        submit_type: 'pay',
        subscription: null,
        success_url: 'https://example.com/success',
        total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 0 },
        url: null
      }
    },
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: 'idempotency_key_test' },
  };
};

// Send the webhook to our endpoint with debug mode enabled
const sendRealisticWebhookTest = async () => {
  try {
    const payload = createRealisticCheckoutPayload();
    console.log('Realistic payload created with these customer details:');
    console.log('- Customer ID:', payload.data.object.customer);
    console.log('- Email (customer_details):', payload.data.object.customer_details.email);
    console.log('- Email (customer_email):', payload.data.object.customer_email);
    console.log('- Email (metadata):', payload.data.object.metadata.email);
    console.log('- Name:', payload.data.object.customer_details.name);
    console.log('- Payment Intent:', payload.data.object.payment_intent);
    console.log('- Membership Type:', payload.data.object.metadata.membershipType);
    
    console.log('\nSending realistic webhook payload to webhook endpoint...');
    const response = await axios.post('http://localhost:3000/api/webhook', payload, {
      headers: {
        'Content-Type': 'application/json',
        // Include a dummy signature to trigger debug mode
        'stripe-signature': 'dummy_signature_for_debug_mode'
      }
    });
    
    console.log('✅ Realistic webhook test completed!');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    console.log('\n=== REALISTIC WEBHOOK TEST - COMPLETED ===');
    console.log('Check your Next.js console logs to see the detailed customer information from this test.');
    console.log('You should see all the different sources of customer data being logged.');
    
    // Extract customer details from the session
    const session = payload.data.object;
    
    // Get the customer email (from either of these two sources)
    const customerEmail = session.customer?.email || session.payment_intent?.receipt_email;
    
    if (customerEmail) {
      console.log(`Customer email detected: ${customerEmail}`);
      
      // Now use Brevo to send the confirmation email
      // This would call your existing email sending function
      const membershipType = "digital"; // Or whatever value is appropriate from the session
      
      // Send email using Brevo API
      await sendMembershipConfirmationEmail({
        email: customerEmail,
        name: session.customer?.name || "Adhérent", // Fallback if name isn't available
        membershipType: membershipType,
        date: new Date().toLocaleDateString('fr-FR'),
        // Add any other details from the session you want to include
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error sending realistic webhook:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
};

// Run the test
sendRealisticWebhookTest(); 