/**
 * Test script to demonstrate extracting email from Stripe webhook payload and sending email
 * This simulates the webhook handler logic for testing
 */
require('dotenv').config({ path: '.env.local' });
const SibApiV3Sdk = require('sib-api-v3-sdk');

// Initialize Brevo API client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Log start
console.log('=== STRIPE EMAIL EXTRACTION TEST - STARTING ===');
console.log('Timestamp:', new Date().toISOString());

// Function to test email extraction from different Stripe payload formats
async function testEmailExtraction() {
  try {
    // Test with the actual payload you provided
    const realPayload = {
      id: "ppage_1R4is1Cw2RExVENhGRGY3l6q",
      object: "checkout.session",
      customer: {
        id: "cus_RygLMvwOLzrW0s",
        object: "customer",
        address: {
          city: "Paris",
          country: "FR",
          line1: "27 Rue des Batignolles",
          line2: null,
          postal_code: "75017",
          state: null
        },
        customer_provided: false,
        email: "m20plasse@gmail.com",
        has_fallback_payment_method: false,
        payment_methods: [],
        phone: null
      },
      payment_intent: {
        id: "pi_3R4iyyCw2RExVENh19yrRHAa",
        object: "payment_intent",
        receipt_email: "m20plasse@gmail.com",
        // Other payment intent fields...
      }
    };

    console.log('\n=== TESTING EMAIL EXTRACTION FROM REAL PAYLOAD ===');
    const customerEmail = extractEmail(realPayload);
    console.log(`Extracted email: ${customerEmail}`);

    // Create a simplified session data example with different formats
    const testSessionTypes = [
      {
        name: "Email in customer_details",
        session: {
          id: "cs_test_123",
          customer_details: { email: "customer_details@example.com", name: "Details Test" },
          created: Math.floor(Date.now() / 1000),
          amount_total: 3200
        }
      },
      {
        name: "Email in customer_email field",
        session: {
          id: "cs_test_456",
          customer_email: "customer_email_field@example.com",
          created: Math.floor(Date.now() / 1000),
          amount_total: 6500
        }
      },
      {
        name: "Email in customer object",
        session: {
          id: "cs_test_789",
          customer: { email: "customer_object@example.com" },
          created: Math.floor(Date.now() / 1000),
          amount_total: 3200
        }
      },
      {
        name: "Email in payment_intent",
        session: {
          id: "cs_test_101",
          payment_intent: { receipt_email: "payment_intent@example.com" },
          created: Math.floor(Date.now() / 1000),
          amount_total: 3200
        }
      },
      {
        name: "Email in metadata",
        session: {
          id: "cs_test_112",
          metadata: { email: "metadata@example.com", membershipType: "premium" },
          created: Math.floor(Date.now() / 1000),
          amount_total: 9900
        }
      }
    ];

    console.log('\n=== TESTING EMAIL EXTRACTION FROM DIFFERENT FORMATS ===');
    for (const test of testSessionTypes) {
      const email = extractEmail(test.session);
      console.log(`${test.name}: ${email}`);
    }

    // Send a test email to your Gmail address
    if (customerEmail) {
      console.log('\n=== SENDING TEST EMAIL TO EXTRACTED ADDRESS ===');
      await sendTestEmail(customerEmail, "Test User");
    }

    console.log('\n=== STRIPE EMAIL EXTRACTION TEST - COMPLETED ===');
    return true;
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    return false;
  }
}

// Extract email from session in the same way as the webhook handler
function extractEmail(session) {
  const customerEmail = 
    // First try from customer details if present
    session.customer_details?.email ||
    // Then from customer_email field
    session.customer_email ||
    // Then from the customer object
    (session.customer && typeof session.customer === 'object' && 'email' in session.customer ? 
      session.customer.email : null) ||
    // Then from payment_intent if available
    (session.payment_intent && typeof session.payment_intent === 'object' && 
      'receipt_email' in session.payment_intent ? session.payment_intent.receipt_email : null) ||
    // Then from metadata if present
    session.metadata?.email;
  
  return customerEmail;
}

// Send a test email
async function sendTestEmail(email, name) {
  console.log(`Sending test email to: ${email}`);
  
  // Create sender info
  const sender = {
    email: process.env.BREVO_SENDER_EMAIL || 'solene.legendre@polyarthrite-andar.com',
    name: process.env.BREVO_SENDER_NAME || 'ANDAR'
  };
  
  try {
    // Create email with direct HTML
    const testEmail = new SibApiV3Sdk.SendSmtpEmail();
    testEmail.to = [{
      email: email,
      name: name
    }];
    testEmail.subject = 'ANDAR - Test de la réception des emails de confirmation';
    testEmail.htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #e63946;">ANDAR - Test de Webhook</h1>
            </div>
            
            <p>Bonjour ${name},</p>
            
            <p>Ceci est un <strong>test</strong> de notre système d'extraction d'emails depuis les webhooks Stripe.</p>
            
            <p>Si vous recevez cet email, cela signifie que notre système fonctionne correctement et que nous pouvons extraire votre adresse email des données de paiement.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Informations techniques:</strong></p>
              <p style="margin: 5px 0;">Date: ${new Date().toLocaleString('fr-FR')}</p>
              <p style="margin: 5px 0;">Adresse email extraite: ${email}</p>
              <p style="margin: 5px 0;">ID de test: ${Math.random().toString(36).substring(2, 10)}</p>
            </div>
            
            <p>Merci pour votre adhésion à l'ANDAR!</p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
              <p>Cet email a été envoyé automatiquement depuis le système de webhooks Stripe.</p>
              <p>© ${new Date().getFullYear()} ANDAR - Association Nationale de Défense contre l'Arthrite Rhumatoïde</p>
            </div>
          </div>
        </body>
      </html>
    `;
    testEmail.sender = sender;
    
    const response = await apiInstance.sendTransacEmail(testEmail);
    console.log('✅ TEST EMAIL SENT SUCCESSFULLY!');
    console.log('Message ID:', response.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending test email:', error.message);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error details:', error.response.text);
    }
    return false;
  }
}

// Run the test
testEmailExtraction(); 