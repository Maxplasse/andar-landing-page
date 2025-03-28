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
    const { priceId, successUrl, cancelUrl } = req.body;

    if (!priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const secretKey = getStripeKey();
    const stripe = new Stripe(secretKey as string, {
      apiVersion: '2023-10-16' as any,
    });

    // Create a payment link with the provided parameters
    const paymentLink = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Collect customer information during checkout
      billing_address_collection: 'required',
      customer_email: req.body.customerEmail || undefined,
      // Add metadata if needed
      metadata: {
        source: 'andar_website',
        environment: isProduction ? 'production' : 'test'
      },
    });

    console.log(`Payment link created:
      ID: ${paymentLink.id}
      URL: ${paymentLink.url}
      Environment: ${isProduction ? 'Production' : 'Test'}
    `);

    res.status(200).json({
      id: paymentLink.id,
      url: paymentLink.url,
    });
  } catch (error: any) {
    console.error('Error creating payment link:', error);
    res.status(500).json({ 
      error: 'Failed to create payment link',
      message: error.message 
    });
  }
} 