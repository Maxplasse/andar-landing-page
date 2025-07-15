import React from 'react';
import styled from 'styled-components';
import Image from 'next/image';

const InfoContainer = styled.section`
  padding: 50px 0;
  display: flex;
  flex-direction: column;
  gap: 50px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 30px 20px;
  }
`;

const InfoBox = styled.div`
  display: flex;
  align-items: stretch;
  gap: 30px;
  width: 100%;
  position: relative;

  @media (max-width: 992px) {
    flex-direction: column;
  }
`;

const ImageWrapper = styled.div`
  flex: 1;
  position: relative;
  min-height: 400px;
  border-radius: 10px;
  overflow: hidden;
  transform: scale(1.2);
  z-index: 1;
  margin-left: -50px;

  &::after {
    content: '';
    position: relative;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, rgba(255,255,255,0.57) 0%, rgba(255,255,255,0.1) 43.5%);
    z-index: 1;
  }

  @media (max-width: 992px) {
    min-height: 300px;
    transform: scale(1);
    margin-left: 0;
  }
`;

const GlassCard = styled.div`
  flex: 1;
  background: linear-gradient(45deg, rgba(171, 24, 81, 0.08), rgba(171, 24, 81, 0.19));
  backdrop-filter: blur(40px);
  border-radius: 10px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  z-index: 2;
  margin-right: -100px;
  
  @media (max-width: 992px) {
    margin-right: 0;
  }
`;

const InfoTitle = styled.h2`
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 31px;
  line-height: 1.21;
  color: var(--color-black);
`;

const InfoText = styled.p`
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 18px;
  line-height: 1.21;
  color: var(--color-black);
`;

const InfoSection: React.FC = () => {
  return (
    <InfoContainer>
      <InfoBox>
        <GlassCard>
          <InfoTitle>La polyarthrite rhumatoïde, quèsaco ?</InfoTitle>
          <InfoText>
            <br /><br />
            Cette maladie inflammatoire auto-immune touche les articulations. L'inflammation peut causer des dommages irréparables, des déformations et, à terme, des handicaps. Malgré les immenses progrès des traitements, on ne peut à ce jour pas guérir de cette maladie.
            <br /><br />
            Manque de connaissance, incompréhension de l'entourage, solitude, les malades se retrouvent souvent isolés et démunis face à la douleur et à la fatigue causées par la polyarthrite.
          </InfoText>
        </GlassCard>
        <ImageWrapper>
          <Image 
            src="/images/polyarthrite_rhumatoide.png" 
            alt="Polyarthrite Rhumatoïde" 
            fill
            style={{ objectFit: 'cover' }}
          />
        </ImageWrapper>
      </InfoBox>
    </InfoContainer>
  );
};

export default InfoSection; 