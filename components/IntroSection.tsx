import React from 'react';
import styled from 'styled-components';

const IntroTitle = styled.p`
  text-align: center;
  font-size: 30px;
`;

const IntroContainer = styled.section`
  padding: 80px 0;
  text-align: center;
`;


const PurpleText = styled.span`
  color: #AB1851;
`;


const OrangeText = styled.span`
  color: #E99900;
`;

const IntroText = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-weight: 400;
  font-size: 25px;
  line-height: 1.22;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;

  strong {
    font-weight: 700;
  }
`;

const IntroSection: React.FC = () => {
  return (
    <IntroContainer>
      <IntroTitle>
      <strong>Avec l'ANDAR, soutenons <PurpleText>les malades</PurpleText> pour faciliter <OrangeText>leur quotidien.</OrangeText></strong>
      </IntroTitle>
      <br /><br />
      <IntroText> 
        Cuisiner, lacer ses chaussures, écrire un SMS... pour les 350 000 enfants, femmes et hommes atteints de polyarthrite rhumatoïde, ces actes du quotidien nécessitent un combat de chaque instant contre la douleur.
      </IntroText>
    </IntroContainer>
  );
};

export default IntroSection; 