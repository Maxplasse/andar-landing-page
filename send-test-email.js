/**
 * Direct test email script to a specific address
 * This bypasses the Stripe webhook flow entirely and sends directly via Brevo
 */
require('dotenv').config({ path: '.env.local' });
const SibApiV3Sdk = require('sib-api-v3-sdk');

// Initialize Brevo API client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Test email recipient
const TEST_EMAIL = 'm20plasse@gmail.com';
const TEST_NAME = 'Max Test';

// Function to send a test email
async function sendTestEmail() {
  console.log('=== DIRECT TEST EMAIL TO SPECIFIC ADDRESS ===');
  console.log(`Sending test email to: ${TEST_EMAIL}`);
  
  // Display environment variables
  console.log('\n=== ENVIRONMENT CHECK ===');
  console.log('BREVO_API_KEY exists:', Boolean(process.env.BREVO_API_KEY));
  console.log('BREVO_API_KEY starts with:', process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.substring(0, 10) + '...' : 'NOT SET');
  console.log('BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL || 'solene.legendre@polyarthrite-andar.com');
  console.log('BREVO_SENDER_NAME:', process.env.BREVO_SENDER_NAME || 'ANDAR');
  
  // Create sender info
  const sender = {
    email: process.env.BREVO_SENDER_EMAIL || 'solene.legendre@polyarthrite-andar.com',
    name: process.env.BREVO_SENDER_NAME || 'ANDAR'
  };
  
  // Create test emails with different methods to see which one works
  await sendTemplateEmail(sender);
  await sendDirectEmail(sender);
}

// Try sending with template
async function sendTemplateEmail(sender) {
  console.log('\n=== ATTEMPTING TO SEND TEMPLATE EMAIL ===');
  
  // Create email with template
  const templateEmail = new SibApiV3Sdk.SendSmtpEmail();
  templateEmail.to = [{
    email: TEST_EMAIL,
    name: TEST_NAME
  }];
  templateEmail.templateId = 7;
  templateEmail.params = {
    name: TEST_NAME,
    membershipType: "digital",
    date: new Date().toLocaleDateString('fr-FR'),
    membershipDetails: {
      name: "Adhésion Test Gmail",
      price: "32€",
      description: "Test direct de l'API Brevo vers Gmail - AVEC TEMPLATE",
      duration: "1 an"
    }
  };
  templateEmail.sender = sender;
  
  try {
    console.log('Sending template email...');
    console.log('- From:', sender.email);
    console.log('- To:', TEST_EMAIL);
    console.log('- Template ID:', 7);
    
    const response = await apiInstance.sendTransacEmail(templateEmail);
    console.log('✅ TEMPLATE EMAIL SENT SUCCESSFULLY!');
    console.log('Message ID:', response.messageId);
    return { success: true, messageId: response.messageId };
  } catch (error) {
    console.error('❌ Error sending template email:', error.message);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error details:', error.response.text);
    }
    return { success: false, error: error.message };
  }
}

// Try sending with direct HTML content
async function sendDirectEmail(sender) {
  console.log('\n=== ATTEMPTING TO SEND DIRECT HTML EMAIL ===');
  
  // Create email with direct HTML
  const directEmail = new SibApiV3Sdk.SendSmtpEmail();
  directEmail.to = [{
    email: TEST_EMAIL,
    name: TEST_NAME
  }];
  directEmail.subject = 'ANDAR - Test Direct Email (Sans Template)';
  directEmail.htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #e63946;">ANDAR Test Email</h1>
          </div>
          
          <p>Bonjour ${TEST_NAME},</p>
          
          <p>Ceci est un <strong>test direct</strong> de l'API Brevo sans utiliser de template.</p>
          
          <p>Si vous recevez cet email, cela signifie que:</p>
          <ol>
            <li>L'API Brevo fonctionne correctement</li>
            <li>Les emails sont délivrés à Gmail</li>
            <li>Le problème pourrait être lié aux templates ou à la configuration DNS</li>
          </ol>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Détails techniques:</strong></p>
            <p style="margin: 5px 0;">Date: ${new Date().toLocaleString('fr-FR')}</p>
            <p style="margin: 5px 0;">Méthode d'envoi: Email direct (sans template)</p>
            <p style="margin: 5px 0;">Expéditeur: ${sender.email}</p>
            <p style="margin: 5px 0;">ID de test: ${Math.random().toString(36).substring(2, 10)}</p>
          </div>
          
          <p>Merci de votre aide pour résoudre ce problème!</p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
            <p>Cet email a été envoyé par ANDAR à des fins de test uniquement.</p>
            <p>© ${new Date().getFullYear()} ANDAR - Association Nationale de Défense contre l'Arthrite Rhumatoïde</p>
          </div>
        </div>
      </body>
    </html>
  `;
  directEmail.sender = sender;
  
  try {
    console.log('Sending direct HTML email...');
    console.log('- From:', sender.email);
    console.log('- To:', TEST_EMAIL);
    
    const response = await apiInstance.sendTransacEmail(directEmail);
    console.log('✅ DIRECT HTML EMAIL SENT SUCCESSFULLY!');
    console.log('Message ID:', response.messageId);
    return { success: true, messageId: response.messageId };
  } catch (error) {
    console.error('❌ Error sending direct HTML email:', error.message);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error details:', error.response.text);
    }
    return { success: false, error: error.message };
  }
}

// Execute the test
sendTestEmail().then(() => {
  console.log('\n=== EMAIL TEST COMPLETE ===');
  console.log('Please check your Gmail inbox (and spam folder) for both test emails.');
  console.log('If you receive the direct HTML email but not the template email, the issue is with the template.');
  console.log('If you do not receive either email, the issue is likely with DNS configuration.');
}).catch(error => {
  console.error('Unhandled error in test:', error);
}); 