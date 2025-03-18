import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  background-color: var(--color-secondary);
  padding: 60px 20px;
  text-align: center;
  color: var(--color-white);
`;

const FooterTitle = styled.h2`
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 42px;
  line-height: 1.21;
  margin-bottom: 30px;
`;

const FooterText = styled.p`
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 19px;
  line-height: 1.21;
  max-width: 800px;
  margin: 0 auto;
`;

const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <FooterTitle>L'ANDAR, créée par les malades, pour les malades !</FooterTitle>
      <FooterText>
        Fondée en 1984 et animée par des patients bénévoles, l'Association nationale de défense contre la polyarthrite rhumatoïde (ANDAR) répond aux besoins des malades.
      </FooterText>
    </FooterContainer>
  );
};

export default Footer; 