import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const SectionContainer = styled.section`
  padding: 80px 20px;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #ffffff;
  position: relative;
  z-index: 1;
  min-height: 300px;
  width: 100%;
`;

const SectionTitle = styled.h2`
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 42px;
  line-height: 1.21;
  color: var(--color-black);
  margin-bottom: 60px;
  text-align: center;
`;

const MembershipCardsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 100px;
  width: 100%;

  @media (max-width: 992px) {
    flex-direction: column;
    align-items: center;
  }
`;

const HighlightedText = styled.span`
  background-color: #AB1851;
  color: white;
  padding: 0 10px;
  border-radius: 4px;
`;

const MembershipCard = styled.div<{ variant: 'digital' | 'classic' }>`
  border: 1px solid var(--color-black);
  border-radius: 18px;
  background-color: var(--color-white);
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 30px;
  position: relative;
  box-shadow: 8px 8px 0 ${props => props.variant === 'digital' ? 'var(--color-secondary)' : 'var(--color-accent)'};
  margin-right: 8px;
  margin-bottom: 8px;
  text-align: center;
`;

const CardTitle = styled.h3`
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 31px;
  line-height: 1.21;
  margin-bottom: 20px;
  margin-top: 0;
  text-align: center;
`;

const CardPrice = styled.div`
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 42px;
  line-height: 1;
  margin-bottom: 40px;

  span {
    font-size: 22px;
  }
`;

const CardFeatures = styled.ul`
  font-family: 'Inclusive Sans', sans-serif;
  font-weight: 400;
  font-size: 18px;
  line-height: 1.5;
  list-style-type: none;
  text-align: center;
  padding: 0;
  width: 100%;
`;

const CardFeature = styled.li`
  margin-bottom: 15px;
  
  span {
    font-weight: 900;
  }
`;

const JoinButton = styled.a<{ variant: 'digital' | 'classic' }>`
  background-color: ${props => props.variant === 'digital' ? 'var(--color-secondary)' : 'var(--color-accent)'};
  color: var(--color-white);
  border: none;
  border-radius: 6px;
  padding: 15px 40px;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 25px;
  cursor: pointer;
  text-align: center;
  display: inline-block;
  margin-bottom: 40px;
  width: 100%;
  max-width: 240px;
  text-decoration: none;
  transition: transform 0.2s ease, opacity 0.2s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
`;

// Add a loading state while payment links are being created
const LoadingButton = styled.div<{ variant: 'digital' | 'classic' }>`
  background-color: ${props => props.variant === 'digital' ? 'var(--color-secondary)' : 'var(--color-accent)'};
  color: var(--color-white);
  opacity: 0.7;
  border: none;
  border-radius: 6px;
  padding: 15px 40px;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 25px;
  text-align: center;
  display: inline-block;
  margin-bottom: 40px;
  width: 100%;
  max-width: 240px;
`;

const MembershipSection: React.FC = () => {
  // State to store payment links
  const [digitalMembershipLink, setDigitalMembershipLink] = useState<string>('');
  const [classicMembershipLink, setClassicMembershipLink] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Create payment links with success and cancel URLs
  useEffect(() => {
    const createPaymentLinks = async () => {
      try {
        // Get the base URL for the success/cancel redirects
        const baseUrl = window.location.origin;
        
        // Create payment links with success redirect
        const digitalResponse = await fetch('/api/create-payment-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            membershipType: 'digital',
            successUrl: `${baseUrl}/merci-adhesion`,
            cancelUrl: `${baseUrl}/#adhesion`
          }),
        });
        
        const classicResponse = await fetch('/api/create-payment-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            membershipType: 'classic',
            successUrl: `${baseUrl}/merci-adhesion`,
            cancelUrl: `${baseUrl}/#adhesion`
          }),
        });

        if (digitalResponse.ok && classicResponse.ok) {
          const digitalData = await digitalResponse.json();
          const classicData = await classicResponse.json();
          
          console.log('Digital membership link:', digitalData.url);
          console.log('Classic membership link:', classicData.url);
          
          setDigitalMembershipLink(digitalData.url);
          setClassicMembershipLink(classicData.url);
        } else {
          console.error('Failed to create payment links');
          console.error('Digital response status:', digitalResponse.status);
          console.error('Classic response status:', classicResponse.status);
          
          // Attempt to get error details
          try {
            const digitalError = await digitalResponse.json();
            console.error('Digital error:', digitalError);
          } catch (e) {}
          
          try {
            const classicError = await classicResponse.json();
            console.error('Classic error:', classicError);
          } catch (e) {}
          
          // Fallback to static links if API fails
          setDigitalMembershipLink("https://buy.stripe.com/test_00g14R9VW6BDexabIJ");
          setClassicMembershipLink("https://buy.stripe.com/test_5kA5l7b00aRT60E9AC");
        }
      } catch (error) {
        console.error('Error creating payment links:', error);
        // Fallback to static links if API fails
        setDigitalMembershipLink("https://buy.stripe.com/test_00g14R9VW6BDexabIJ");
        setClassicMembershipLink("https://buy.stripe.com/test_5kA5l7b00aRT60E9AC");
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentLinks();
  }, []);
  
  return (
    <SectionContainer id="adhesion">
      <SectionTitle>Quelles <HighlightedText>formules d'adhésion</HighlightedText> à l'ANDAR ?</SectionTitle>
      
      <MembershipCardsContainer>
        <MembershipCard variant="digital">
          <CardTitle>Adhésion Numérique</CardTitle>
          <CardPrice>5€<span>/an</span></CardPrice>
          
          {isLoading ? (
            <LoadingButton variant="digital">Chargement...</LoadingButton>
          ) : (
            <JoinButton 
              href={digitalMembershipLink} 
              variant="digital"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-adhesion-digital"
            >
              J'adhère
            </JoinButton>
          )}
          
          <CardFeatures>
            <CardFeature><span>Revue</span> ANDAR numérique</CardFeature>
            <CardFeature><span>Webconférences</span> illimitées</CardFeature>
            <CardFeature><span>Ressources</span> dédiées (brochures et documents)</CardFeature>
            <CardFeature><span>Accès</span> MaPatho Plus (outil pour gérer vos parcours soins)</CardFeature>
          </CardFeatures>
        </MembershipCard>

        <MembershipCard variant="classic">
          <CardTitle>Adhésion Classique</CardTitle>
          <CardPrice>32€<span>/an</span></CardPrice>
          
          {isLoading ? (
            <LoadingButton variant="classic">Chargement...</LoadingButton>
          ) : (
            <JoinButton 
              href={classicMembershipLink} 
              variant="classic"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-adhesion-classic"
            >
              J'adhère
            </JoinButton>
          )}
          
          <CardFeatures>
            <CardFeature><span>Soutien</span> à 350 000 malades</CardFeature>
            <CardFeature><span>Revue</span> ANDAR Infos (3/an)</CardFeature>
            <CardFeature><span>Webconférences</span> illimitées</CardFeature>
            <CardFeature><span>Ressources</span> dédiées (brochures et documents)</CardFeature>
            <CardFeature><span>Accès</span> MaPatho Plus (outil pour gérer vos parcours soins)</CardFeature>
          </CardFeatures>
        </MembershipCard>
      </MembershipCardsContainer>
    </SectionContainer>
  );
};

export default MembershipSection; 