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
  justify-content: center;
  line-height: 1.21;
  color: var(--color-black);
  margin-bottom: 50px;
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

const ImageContainer = styled.div`
  flex: 1;
  position: relative;
  min-height: 300px;
  border-radius: 10px;
  overflow: hidden;
`;

const WhyJoinSection: React.FC = () => {
  return (
    <SectionContainer>
      <SectionTitle>Pourquoi adhérer à l'ANDAR ?</SectionTitle>
      
      <BenefitsContainer>
        <BenefitRow>
          <BenefitContent>
            <BenefitTitle>Un accès privilégié à l'information</BenefitTitle>
            <BenefitText>
              En tant qu'adhérent, vous accédez aux revues ANDAR Infos, aux brochures pratiques et avez accès à MaPatho Plus, notre outil de suivi personnalisé.
            </BenefitText>
          </BenefitContent>
          <ImageContainer>
            <Image
              src="/images/andar_accompagnement.png"
              alt="ANDAR Accompagnement"
              fill
              style={{ objectFit: 'cover' }}
            />
          </ImageContainer>
        </BenefitRow>

        <BenefitRow>
          <BenefitContent>
            <BenefitTitle>Un soutien direct aux actions de l'ANDAR</BenefitTitle>
            <BenefitText>
              Votre adhésion permet de financer nos actions : sensibilisation du grand public, défense des droits des patients, recherche et accompagnement des malades.
            </BenefitText>
          </BenefitContent>
          <ImageContainer>
            <Image
              src="/images/img_financement.png"
              alt="Financement ANDAR"
              fill
              style={{ objectFit: 'cover' }}
            />
          </ImageContainer>
        </BenefitRow>
      </BenefitsContainer>
    </SectionContainer>
  );
};

export default WhyJoinSection; 