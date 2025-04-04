import React from 'react';
import styled from 'styled-components';
import Image from 'next/image';

const SectionContainer = styled.section`
  padding: 80px 0;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 992px) {
    padding: 60px 20px;
  }
`;

const SectionTitle = styled.h2`
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 42px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  line-height: 1.21;
  color: var(--color-black);
  margin-bottom: 50px;
  
  @media (max-width: 768px) {
    font-size: 32px;
  }
  
  @media (max-width: 480px) {
    font-size: 28px;
  }
`;

const BenefitsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 60px;
`;

const BenefitRow = styled.div`
  display: flex;
  align-items: center;
  gap: 50px;

  @media (max-width: 992px) {
    flex-direction: column;
    gap: 30px;
  }

  &:nth-child(even) {
    flex-direction: row-reverse;

    @media (max-width: 992px) {
      flex-direction: column;
    }
  }
`;

const BenefitContent = styled.div`
  flex: 1;
  
  @media (max-width: 992px) {
    width: 100%;
  }
`;

const BenefitTitle = styled.h3`
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 26px;
  line-height: 1.21;
  color: var(--color-black);
  font-weight: bold;
  margin-bottom: 20px;
`;

const BenefitText = styled.p`
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 24px;
  line-height: 1.21;
  color: var(--color-black);
`;

const OrangeText = styled.span`
  color: #E99900;
`;

const PurpleText = styled.span`
  color: #AB1851;
`;

const ImageContainer = styled.div`
  flex: 1;
  position: relative;
  height: 350px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 992px) {
    width: 100%;
    height: 250px;
  }
`;

const StyledImage = styled(Image)`
  object-fit: cover;
  width: 100%;
  height: 100%;
`;

const HighlightedTextOrange = styled.span`
  background-color: #E99900;
  color: white;
  padding: 0 10px;
  border-radius: 4px;
  display: inline-block;
  position: relative;
  white-space: nowrap;
  margin: 0 5px;
  
  @media (max-width: 768px) {
    padding: 0 8px;
    white-space: normal;
  }
  
  @media (max-width: 480px) {
    padding: 0 6px;
    white-space: normal;
    display: inline;
  }
`;

const WhyJoinSection: React.FC = () => {
  return (
    <SectionContainer>
      <SectionTitle>Pourquoi <HighlightedTextOrange>adhérer</HighlightedTextOrange> à l'ANDAR ?</SectionTitle>
      
      <BenefitsContainer>
        <BenefitRow>
          <BenefitContent>
            <BenefitTitle>Un <OrangeText>accès privilégié</OrangeText> à l'information</BenefitTitle>
            <BenefitText>
              En tant qu'adhérent, vous accédez aux revues ANDAR Infos, aux brochures pratiques et avez accès à MaPatho Plus, notre outil de suivi personnalisé.
            </BenefitText>
          </BenefitContent>
          <ImageContainer>
            <Image
              src="/images/andar_accompagnement.png"
              alt="ANDAR Accompagnement"
              fill
              sizes="(max-width: 992px) 100vw, 50vw"
              priority
            />
          </ImageContainer>
        </BenefitRow>

        <BenefitRow>
          <BenefitContent>
            <BenefitTitle>Un <PurpleText>soutien direct</PurpleText> aux actions de l'ANDAR</BenefitTitle>
            <BenefitText>
              Votre adhésion permet de financer nos actions : sensibilisation du grand public, défense des droits des patients, recherche et accompagnement des malades.
            </BenefitText>
          </BenefitContent>
          <ImageContainer>
            <Image
              src="/images/img_financement.png"
              alt="Financement ANDAR"
              fill
              sizes="(max-width: 992px) 100vw, 50vw"
              priority
            />
          </ImageContainer>
        </BenefitRow>
      </BenefitsContainer>
    </SectionContainer>
  );
};

export default WhyJoinSection; 