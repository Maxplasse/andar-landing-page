import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import Image from 'next/image';

const HeaderContainer = styled.header`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 50px;
  width: 100%;
  background-color: var(--color-secondary);
  
  @media (max-width: 768px) {
    padding: 15px 20px;
  }
`;

const Logo = styled.div`
  position: relative;
  width: 250px;
  height: 100px;
  
  @media (max-width: 768px) {
    width: 180px;
    height: 70px;
  }
`;

const LegalPageHeader: React.FC = () => {
  return (
    <HeaderContainer>
      <Link href="/" passHref>
        <Logo>
          <Image 
            src="/images/logo_andar_blanc.png" 
            alt="ANDAR Logo" 
            fill
            style={{ objectFit: 'contain' }}
          />
        </Logo>
      </Link>
    </HeaderContainer>
  );
};

export default LegalPageHeader; 