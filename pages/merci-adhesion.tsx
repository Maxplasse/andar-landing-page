import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styled from 'styled-components';
import Link from 'next/link';
import Image from 'next/image';
import LegalFooter from '@/components/LegalFooter';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  background-color: var(--color-primary);
  width: 100%;
  padding: 20px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 10;
`;

const Logo = styled.div`
  position: relative;
  width: 250px;
  height: 100px;
  margin: 0 auto;
`;

const ThankYouContainer = styled.div`
  flex: 1;
  max-width: 1000px;
  margin: 0 auto;
  padding: 60px 20px;
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 40px 15px;
  }
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  color: var(--color-primary);
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const ThankYouMessage = styled.p`
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 20px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
`;

const MembershipDetails = styled.div`
  background-color: #f8f8f8;
  padding: 20px;
  border-radius: 10px;
  margin: 30px auto;
  max-width: 500px;
  text-align: left;
`;

const DetailItem = styled.p`
  margin-bottom: 10px;
  
  strong {
    color: var(--color-primary);
  }
`;

const BackToHomeButton = styled.a`
  display: inline-block;
  background-color: var(--color-primary);
  color: white;
  font-weight: 700;
  padding: 15px 30px;
  border-radius: 6px;
  margin-top: 30px;
  text-decoration: none;
  transition: transform 0.2s ease, opacity 0.2s ease;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
`;

const ReferenceNumber = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-top: 10px;
`;

const MerciAdhesion: React.FC = () => {
  const router = useRouter();
  const { type, session_id } = router.query;
  const [membershipType, setMembershipType] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  
  useEffect(() => {
    if (type) {
      if (type === 'digital') {
        setMembershipType('Adhésion Numérique');
        setPrice('5€');
      } else if (type === 'classic') {
        setMembershipType('Adhésion Classique');
        setPrice('32€');
      }
    }
  }, [type]);
  
  // Format today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Calculate membership expiration date (1 year from today)
  const expirationDate = new Date(today);
  expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  const formattedExpirationDate = expirationDate.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const initiateCheckout = async (
    membershipType: 'digital' | 'classic',
    email: string,
    name: string = ''
  ) => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membershipType, // 'digital' or 'classic'
          email,          // customer email
          name,           // optional customer name
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creating checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      // Handle error (show message to user)
    }
  };
  
  return (
    <PageContainer>
      <Head>
        <title>Merci pour votre adhésion | ANDAR</title>
        <meta name="description" content="Merci pour votre adhésion à l'ANDAR, Association nationale de défense contre la polyarthrite rhumatoïde." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Header>
        <Logo>
          <Image 
            src="/images/logo_andar_blanc.png" 
            alt="ANDAR Logo" 
            fill
            style={{ objectFit: 'contain' }}
          />
        </Logo>
      </Header>
      
      <ThankYouContainer>
        <PageTitle>Merci pour votre adhésion !</PageTitle>
        
        <ThankYouMessage>
          Nous vous remercions chaleureusement pour votre adhésion à l'ANDAR. Votre soutien est précieux et contribue directement à nos actions pour les 350 000 personnes atteintes de polyarthrite rhumatoïde en France.
        </ThankYouMessage>
        
        <ThankYouMessage>
          Un email de confirmation vous a été envoyé avec tous les détails de votre adhésion.
        </ThankYouMessage>
        
        {membershipType && (
          <MembershipDetails>
            <DetailItem><strong>Type d'adhésion :</strong> {membershipType}</DetailItem>
            <DetailItem><strong>Montant :</strong> {price}</DetailItem>
            <DetailItem><strong>Date d'adhésion :</strong> {formattedDate}</DetailItem>
            <DetailItem><strong>Valable jusqu'au :</strong> {formattedExpirationDate}</DetailItem>
          </MembershipDetails>
        )}
        
        <ThankYouMessage>
          Si vous avez des questions concernant votre adhésion ou nos services, n'hésitez pas à nous contacter à <a href="mailto:andar@polyarthrite-andar.com" style={{ color: 'var(--color-primary)' }}>andar@polyarthrite-andar.com</a>.
        </ThankYouMessage>
        
        <BackToHomeButton href="/">Retour à l'accueil</BackToHomeButton>
      </ThankYouContainer>
      
      <LegalFooter />
    </PageContainer>
  );
};

export default MerciAdhesion; 