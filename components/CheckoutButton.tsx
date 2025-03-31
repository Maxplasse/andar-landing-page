import React, { useState } from 'react';
import styled from 'styled-components';

const Button = styled.button`
  display: inline-block;
  background-color: var(--color-primary);
  color: white;
  font-weight: 700;
  padding: 15px 30px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.2s ease, opacity 0.2s ease;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  color: red;
  margin-top: 10px;
`;

interface CheckoutButtonProps {
  membershipType: 'digital' | 'classic';
  email: string;
  name?: string;
  buttonText?: string;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  membershipType,
  email,
  name = '',
  buttonText = 'Payer maintenant'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membershipType,
          email,
          name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue lors de la création de la session de paiement');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={handleCheckout} 
        disabled={isLoading || !email}
      >
        {isLoading ? 'Chargement...' : buttonText}
      </Button>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </>
  );
};

export default CheckoutButton; 