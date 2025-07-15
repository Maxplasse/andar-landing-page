import * as SibApiV3Sdk from 'sib-api-v3-sdk';

// Load environment variables explicitly - redundant but ensures they're loaded
function loadEnvVariables() {
  // Check if we're in a Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    console.log('Email utility - loading environment variables');
    
    // Check if environment variables are loaded
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME;
    
    // Log environment status (safely)
    console.log('Environment check in email utility:');
    console.log('- BREVO_API_KEY exists:', Boolean(apiKey));
    if (apiKey) console.log('- BREVO_API_KEY starts with:', apiKey.substring(0, 10) + '...');
    console.log('- BREVO_SENDER_EMAIL:', senderEmail || 'Not set');
    console.log('- BREVO_SENDER_NAME:', senderName || 'Not set');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    
    return {
      apiKey,
      senderEmail: senderEmail || 'solene.legendre@polyarthrite-andar.com',
      senderName: senderName || 'ANDAR',
    };
  }
  
  console.error('Process environment not available');
  return {
    apiKey: undefined,
    senderEmail: 'solene.legendre@polyarthrite-andar.com',
    senderName: 'ANDAR',
  };
}

// Get environment variables
const { apiKey: API_KEY, senderEmail: SENDER_EMAIL, senderName: SENDER_NAME } = loadEnvVariables();

if (!API_KEY) {
  console.error('WARNING: BREVO_API_KEY is not set. Emails will not be sent.');
}

// Initialize the Brevo API client
let apiInstance: any; // Use 'any' to avoid TypeScript errors

try {
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = API_KEY;

  // Create an instance of the API class
  apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  console.log('Brevo API client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Brevo API client:', error);
  // Create a placeholder that will throw errors when used
  apiInstance = {};
}

// Define email templates
export enum EmailTemplate {
  MEMBERSHIP_CONFIRMATION = 7, // Template ID in Brevo
}

interface SendEmailOptions {
  to: {
    email: string;
    name?: string;
  };
  templateId: EmailTemplate;
  params?: Record<string, any>;
  subject?: string;
  attachments?: Array<{
    name: string;
    content: string;
    contentType: string;
  }>;
}

/**
 * Send an email using Brevo (formerly Sendinblue)
 * @param options SendEmailOptions object
 * @returns Promise with the API response
 */
export async function sendEmail(options: SendEmailOptions) {
  console.log(`[${new Date().toISOString()}] sendEmail called for recipient: ${options.to.email}`);
  
  try {
    // Double-check if API key is set
    if (!API_KEY) {
      console.error('Cannot send email: BREVO_API_KEY is not set');
      return { 
        success: false, 
        error: new Error('API key is not configured') 
      };
    }

    // Set up the sender information
    const sender = {
      email: SENDER_EMAIL,
      name: SENDER_NAME,
    };

    console.log('Creating email with sender:', sender);

    // Create email send request
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    sendSmtpEmail.to = [{
      email: options.to.email,
      name: options.to.name || options.to.email.split('@')[0],
    }];
    
    sendSmtpEmail.templateId = options.templateId;
    sendSmtpEmail.params = options.params || {};
    sendSmtpEmail.sender = sender;
    
    if (options.subject) {
      sendSmtpEmail.subject = options.subject;
    }

    if (options.attachments) {
      sendSmtpEmail.attachment = options.attachments;
    }

    // Send the email
    console.log(`Sending email to ${options.to.email} using template ID ${options.templateId}`);
    console.log('Email parameters:', JSON.stringify(options.params));
    
    if (!apiInstance.sendTransacEmail) {
      throw new Error('Brevo API client not properly initialized');
    }
    
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully:', response);
    return { success: true, data: response };
  } catch (error: any) { // Type annotation for the error
    console.error('Error sending email:', error);
    // Add more detailed error information
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data || error.response.text || error.response.body);
    }
    return { success: false, error };
  }
}

/**
 * Send a membership confirmation email to a new member
 * @param email Member's email address
 * @param name Member's name
 * @param membershipType Type of membership purchased
 * @returns Promise with the API response
 */
export async function sendMembershipConfirmationEmail(
  email: string,
  name: string,
  membershipType: string
) {
  console.log(`Sending membership confirmation email to ${email} (${name}) for ${membershipType} membership`);
  
  return sendEmail({
    to: { email, name },
    templateId: EmailTemplate.MEMBERSHIP_CONFIRMATION,
    params: {
      name,
      membershipType,
      date: new Date().toLocaleDateString('fr-FR'),
      membershipDetails: getMembershipDetails(membershipType),
    },
  });
}

/**
 * Get formatted membership details based on type
 * @param membershipType Type of membership
 * @returns Object with formatted details
 */
function getMembershipDetails(membershipType: string) {
  switch (membershipType) {
    case 'digital':
      return {
        name: 'Adhésion Numérique',
        price: '5€',
        description: 'Accès à tous les services numériques ANDAR',
        duration: '1 an',
      };
    case 'classic':
      return {
        name: 'Adhésion Classique',
        price: '32€',
        description: 'Adhésion complète à ANDAR avec tous les avantages',
        duration: '1 an',
      };
    default:
      return {
        name: 'Adhésion ANDAR',
        price: 'Variable',
        description: 'Merci pour votre adhésion à ANDAR',
        duration: '1 an',
      };
  }
} 