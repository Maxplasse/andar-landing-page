import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';

// Disable the default body parser to receive the raw body for Stripe signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

const webhookHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2023-10-16' as any, // Use the latest API version available to you
  });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  try {
    // Get the raw body for signature verification
    const rawBody = await buffer(req);
    const signature = req.headers['stripe-signature'] as string;

    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Handle the completed checkout session
        await handleCompletedCheckout(session);
        break;
      }
      
      // You can add more event handlers here if needed
      // case 'payment_intent.succeeded':
      // case 'invoice.paid':
      // etc.
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a success response
    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error(`Webhook error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

// Function to handle completed checkout sessions
const handleCompletedCheckout = async (session: Stripe.Checkout.Session) => {
  try {
    // Get the customer information
    const customerId = session.customer as string;
    const customerEmail = session.customer_details?.email;
    
    // Get the product information from the line items
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2023-10-16' as any, // Use the latest API version available to you
    });
    
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    
    if (lineItems.data.length > 0) {
      // Get the price ID to determine which membership was purchased
      const priceId = lineItems.data[0].price?.id;
      
      // Determine membership type
      let membershipType;
      if (priceId === 'price_1R2VU8C4dgSURMJVPD4tG9pP') {
        membershipType = 'digital';
      } else if (priceId === 'price_1R430AC4dgSURMJVkCXPOCvK') {
        membershipType = 'classic';
      }
      
      console.log(`Membership purchase completed:
        Customer ID: ${customerId}
        Email: ${customerEmail}
        Type: ${membershipType}
        Session ID: ${session.id}
      `);
      
      // TODO: Here you would typically:
      // 1. Register the user in your database
      // 2. Send a confirmation email 
      // 3. Generate access credentials if needed
      // 4. Log the transaction for your records
    }
  } catch (error) {
    console.error('Error processing checkout:', error);
  }
};

export default webhookHandler; 