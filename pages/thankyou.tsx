import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import LegalPageHeader from '@/components/LegalPageHeader';
import LegalFooter from '@/components/LegalFooter';
import Link from 'next/link';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const ThankYouContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 60px 20px;
  flex: 1;
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 40px 15px;
  }
`;

const ThankYouTitle = styled.h1`
  font-size: 3rem;
  color: var(--color-primary);
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const ThankYouMessage = styled.p`
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 30px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const MembershipDetails = styled.div`
  background-color: #f9f9f9;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 40px;
  border: 1px solid #eee;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const MembershipTitle = styled.h2`
  font-size: 1.8rem;
  color: var(--color-primary);
  margin-bottom: 20px;
`;

const MembershipInfo = styled.p`
  font-size: 1.1rem;
  line-height: 1.5;
  margin-bottom: 15px;
`;

const HomeButton = styled.a`
  display: inline-block;
  background-color: var(--color-primary);
  color: white;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 1.1rem;
  text-decoration: none;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.9;
  }
`;

const ThankYouPage: React.FC = () => {
  const router = useRouter();
  const { type } = router.query;
  const [membershipType, setMembershipType] = useState<string>('');
  
  useEffect(() => {
    if (type) {
      setMembershipType(type as string);
    }
  }, [type]);

  return (
    <PageContainer>
      <Head>
        <title>Merci pour votre adhésion | ANDAR</title>
        <meta name="description" content="Merci pour votre adhésion à l'ANDAR, Association nationale de défense contre la polyarthrite rhumatoïde." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <LegalPageHeader />
      
      <ThankYouContainer>
        <ThankYouTitle>Merci pour votre adhésion !</ThankYouTitle>
        
        <ThankYouMessage>
          Nous sommes ravis de vous compter parmi nos membres. Votre soutien est essentiel pour nous aider à accomplir notre mission auprès des 350 000 personnes atteintes de polyarthrite rhumatoïde en France.
        </ThankYouMessage>
        
        <MembershipDetails>
          <MembershipTitle>
            {membershipType === 'digital' ? 'Adhésion Numérique' : 
             membershipType === 'classic' ? 'Adhésion Classique' : 
             'Votre adhésion'}
          </MembershipTitle>
          
          <MembershipInfo>
            Un e-mail de confirmation a été envoyé à l'adresse que vous avez fournie lors de votre paiement.
          </MembershipInfo>
          
          <MembershipInfo>
            {membershipType === 'digital' ? 
              'Vous aurez bientôt accès à tous nos contenus numériques, y compris la revue ANDAR Infos au format PDF et nos webconférences.' : 
             membershipType === 'classic' ? 
              'Vous recevrez prochainement par courrier votre première édition de la revue ANDAR Infos ainsi que toutes les informations pour accéder à nos ressources.' : 
              'Vous recevrez prochainement toutes les informations relatives à votre adhésion.'}
          </MembershipInfo>
        </MembershipDetails>
        
        <Link href="/" passHref>
          <HomeButton>Retour à l'accueil</HomeButton>
        </Link>
      </ThankYouContainer>
      
      <LegalFooter />
    </PageContainer>
  );
};

export default ThankYouPage; 