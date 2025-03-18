import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import Image from 'next/image';

const LegalFooterContainer = styled.section`
  background-color: var(--color-secondary);
  padding: 20px 40px;
  color: var(--color-white);
  position: relative;
  z-index: 1;
`;

const LegalFooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
`;

const Logo = styled.div`
  position: relative;
  width: 200px;
  height: 80px;
`;

const Tagline = styled.div`
  font-size: 12px;
  max-width: 200px;
  margin-left: 10px;
  line-height: 1.3;
`;

const LegalLinks = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  
  @media (max-width: 768px) {
    align-items: center;
  }
`;

const LegalLink = styled.a`
  color: var(--color-white);
  text-decoration: none;
  font-size: 16px;
  font-weight: 400;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.8;
  }
`;

const LegalFooter: React.FC = () => {
  return (
    <LegalFooterContainer>
      <LegalFooterContent>
        <LogoContainer>
          <Logo>
            <Image 
              src="/images/logo_andar_blanc.png" 
              alt="ANDAR Logo" 
              fill
              style={{ objectFit: 'contain', objectPosition: 'left' }}
            />
          </Logo>
        </LogoContainer>
        
        <LegalLinks>
          <LegalLink href="/politique-de-confidentialite">
            Politique de confidentialité
          </LegalLink>
          <LegalLink href="/mentions-legales">
            Mentions Légales
          </LegalLink>
          <LegalLink href="/gestion-des-cookies">
            Gestion des cookies
          </LegalLink>
        </LegalLinks>
      </LegalFooterContent>
    </LegalFooterContainer>
  );
};

export default LegalFooter; 