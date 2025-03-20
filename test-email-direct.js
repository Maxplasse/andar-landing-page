require('dotenv').config({ path: '.env.local' });

// Since the email utility is a TypeScript file, we need to use dynamic import
async function testDirectEmailSend() {
  console.log('=== DIRECT EMAIL SEND TEST ===');
  console.log('Timestamp:', new Date().toISOString());
  
  // Print relevant environment variables
  console.log('\n--- ENVIRONMENT VARIABLES CHECK ---');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('BREVO_API_KEY exists:', Boolean(process.env.BREVO_API_KEY));
  if (process.env.BREVO_API_KEY) {
    console.log('BREVO_API_KEY starts with:', process.env.BREVO_API_KEY.substring(0, 5) + '...');
    console.log('BREVO_API_KEY length:', process.env.BREVO_API_KEY.length);
  }
  console.log('BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL || 'NOT SET');
  console.log('BREVO_SENDER_NAME:', process.env.BREVO_SENDER_NAME || 'NOT SET');
  
  try {
    // Directly use the Brevo SDK to test email sending
    console.log('\nInitializing Brevo SDK directly...');
    const SibApiV3Sdk = require('sib-api-v3-sdk');
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    
    // Test data
    const testEmail = 'm20plasse@gmail.com';
    const testName = 'Test User';
    const membershipType = 'digital';
    
    // Create sender info
    const sender = {
      email: process.env.BREVO_SENDER_EMAIL || 'solene.legendre@polyarthrite-andar.com',
      name: process.env.BREVO_SENDER_NAME || 'ANDAR'
    };
    
    console.log(`\nSending test email to: ${testEmail}`);
    console.log(`Member name: ${testName}`);
    console.log(`Membership type: ${membershipType}`);
    console.log('Using sender:', sender);
    
    // Create template email
    console.log('Creating template email with template ID 7...');
    const templateEmail = new SibApiV3Sdk.SendSmtpEmail();
    templateEmail.to = [{
      email: testEmail,
      name: testName
    }];
    
    templateEmail.templateId = 7;
    templateEmail.params = {
      name: testName,
      membershipType: membershipType,
      date: new Date().toLocaleDateString('fr-FR'),
      membershipDetails: getMembershipDetails(membershipType)
    };
    templateEmail.sender = sender;
    
    // Send the email
    console.log('Sending template email...');
    const response = await apiInstance.sendTransacEmail(templateEmail);
    
    console.log('\n✅ EMAIL SENT SUCCESSFULLY!');
    console.log('Message ID:', response.messageId);
    return true;
  } catch (error) {
    console.error('\n❌ ERROR SENDING EMAIL:', error);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error details:', error.response.text || error.response.data);
    }
    return false;
  }
}

// Helper function to get membership details based on membership type
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

// Run the test
testDirectEmailSend()
  .then(success => {
    console.log('\nTest result:', success ? 'PASSED ✅' : 'FAILED ❌');
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error in test:', err);
    process.exit(1);
  }); 