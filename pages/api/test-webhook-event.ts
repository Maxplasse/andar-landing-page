import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';

// Disable the default body parser to receive the raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // This endpoint should only be available in development mode
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  console.log('=== TEST WEBHOOK EVENT ENDPOINT ===');
  console.log('Date/Time:', new Date().toISOString());
  
  try {
    // Get the raw body
    const rawBody = await buffer(req);
    console.log('Raw body received, length:', rawBody.length);
    
    // Log headers 
    console.log('Headers:');
    Object.entries(req.headers).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
    
    // Parse the raw body
    let bodyString = rawBody.toString();
    console.log('Body string:', bodyString);
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(bodyString);
      console.log('Parsed JSON body:', JSON.stringify(parsedBody, null, 2));
    } catch (parseError) {
      console.error('Error parsing body as JSON:', parseError);
    }
    
    // Return success
    console.log('Event processed successfully by test endpoint');
    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error(`Error in test webhook event endpoint: ${err.message}`);
    res.status(400).send(`Error: ${err.message}`);
  }
} 