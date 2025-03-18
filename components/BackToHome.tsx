import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';

const BackButtonContainer = styled.div`
  margin-bottom: 30px;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: var(--color-primary);
  font-weight: 500;
  text-decoration: none;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.8;
  }
`;

const ArrowIcon = styled.span`
  margin-right: 8px;
  font-size: 18px;
`;

const BackToHome: React.FC = () => {
  return (
    <BackButtonContainer>
      <BackLink href="/">
        <ArrowIcon>←</ArrowIcon>
        Retour à l'accueil
      </BackLink>
    </BackButtonContainer>
  );
};

export default BackToHome; 