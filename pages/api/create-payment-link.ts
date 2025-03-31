// Import the Stripe library and initialize it with your secret key
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// Helper to determine if we're in production mode
const isProduction = process.env.NODE_ENV === 'production';

// Select the appropriate Stripe keys based on environment
const getStripeKey = () => {
  if (isProduction && process.env.STRIPE_LIVE_SECRET_KEY) {
    return process.env.STRIPE_LIVE_SECRET_KEY;
  }
  return process.env.STRIPE_SECRET_KEY;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { membershipType, successUrl, cancelUrl, customerEmail, customerName } = req.body;

    if (!membershipType || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const secretKey = getStripeKey();
    const stripe = new Stripe(secretKey as string, {
      apiVersion: '2025-02-24.acacia' as any,
    });

    // Set price and product details based on membership type
    let amount;
    let productName;

    if (membershipType === 'digital') {
      amount = 500; // 5€ in cents
      productName = 'Adhésion Numérique ANDAR';
    } else if (membershipType === 'classic') {
      amount = 3200; // 32€ in cents
      productName = 'Adhésion Classique ANDAR';
    } else {
      return res.status(400).json({ error: 'Invalid membership type' });
    }

    // Create a payment link with the provided parameters
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: productName,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${successUrl}?type=${membershipType}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      // Collect customer information during checkout
      billing_address_collection: 'required',
      customer_email: customerEmail || undefined,
      // Add metadata if needed
      metadata: {
        membershipType,
        name: customerName || '',
        source: 'andar_website',
        environment: isProduction ? 'production' : 'test'
      },
    });

    console.log(`Payment link created:
      ID: ${session.id}
      URL: ${session.url}
      Environment: ${isProduction ? 'Production' : 'Test'}
    `);

    res.status(200).json({
      id: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Error creating payment link:', error);
    res.status(500).json({ 
      error: 'Failed to create payment link',
      message: error.message 
    });
  }
} 