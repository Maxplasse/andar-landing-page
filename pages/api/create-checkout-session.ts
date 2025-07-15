import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// Helper function to get the right Stripe key based on environment
function getStripeKey(): string {
  // Use live key in production, test key otherwise
  return process.env.NODE_ENV === 'production'
    ? (process.env.STRIPE_LIVE_SECRET_KEY as string)
    : (process.env.STRIPE_SECRET_KEY as string);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get membership type and customer data from request body
    const { membershipType, email, name } = req.body;

    if (!membershipType || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Initialize Stripe with the appropriate key
    const secretKey = getStripeKey();
    const stripe = new Stripe(secretKey as string, {
      apiVersion: '2025-02-24.acacia' as any,
    });

    // Set price and product details based on membership type
    let amount;
    let productName;

    if (membershipType === 'digital') {
      amount = 500; // 5€ in cents
      productName = 'Adhésion Numérique ANDAR – Revue, Webconférences, Ressources, MaPatho Plus';
    } else if (membershipType === 'classic') {
      amount = 3200; // 32€ in cents
      productName = 'Adhésion Classique ANDAR – Version papier + numérique, Webconférences, Ressources, MaPatho Plus';
    } else {
      return res.status(400).json({ error: 'Invalid membership type' });
    }

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
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
      customer_email: email,
      metadata: {
        membershipType,
        name: name || '',
      },
      success_url: `${req.headers.origin}/merci-adhesion?type=${membershipType}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/`,
    });

    // Return the session ID to the client
    res.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Error creating checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 