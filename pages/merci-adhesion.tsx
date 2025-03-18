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

const ThankYouContainer = styled.div`
  flex: 1;
  max-width: 1000px;
  margin: 0 auto;
  padding: 100px 20px;
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 80px 15px;
  }
`;

const Logo = styled.div`
  position: relative;
  width: 250px;
  height: 100px;
  margin: 0 auto 40px;
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

const MerciAdhesion: React.FC = () => {
  const router = useRouter();
  const { type } = router.query;
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
  
  return (
    <PageContainer>
      <Head>
        <title>Merci pour votre adhésion | ANDAR</title>
        <meta name="description" content="Merci pour votre adhésion à l'ANDAR, Association nationale de défense contre la polyarthrite rhumatoïde." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <ThankYouContainer>
        <Logo>
          <Image 
            src="/images/logo_andar.png" 
            alt="ANDAR Logo" 
            fill
            style={{ objectFit: 'contain' }}
          />
        </Logo>
        
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