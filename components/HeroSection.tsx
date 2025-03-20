import React from 'react';
import styled, { keyframes } from 'styled-components';
import Header from './Header';

const HeroContainer = styled.section`
  width: 100%;
  height: 100vh;
  background-image: url('/images/hero_background.png');
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 0 5%;
`;

const HeroTitle = styled.h1`
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 54px;
  line-height: 1.21;
  color: var(--color-white);
  max-width: 800px;
  margin-top: 100px;
  z-index: 2;

  @media (max-width: 768px) {
    font-size: 40px;
  }

  @media (max-width: 480px) {
    font-size: 32px;
  }
`;

// Create the drawing animation
const drawUnderline = keyframes`
  0% {
    stroke-dashoffset: 350;
  }
  100% {
    stroke-dashoffset: 0;
  }
`;

const TextContainer = styled.span`
  position: relative;
  display: inline-flex;
  padding-bottom: 10px;
  padding-left: 10px;
  padding-right: 10px;
`;

const OrangeText = styled.span`
  color: #E99900;
`;

const PurpleText = styled.span`
  color: #AB1851;
`;

const HighlightedText = styled.span`
  background-color: #AB1851;
  color: white;
  padding: 0 10px;
  border-radius: 4px;
  display: inline-block;
  white-space: nowrap;
  
  @media (max-width: 480px) {
    display: inline;
    white-space: normal;
    padding: 2px 6px;
  }
`;

const HighlightedTextOrange = styled.span`
  background-color: #E99900;
  color: white;
  padding: 0 10px;
  border-radius: 4px;
  display: inline-block;
  white-space: nowrap;
  
  @media (max-width: 480px) {
    display: inline;
    white-space: normal;
    padding: 2px 6px;
  }
`;

const UnderlineSVG = styled.svg`
  position: absolute;
  bottom: -5px; /* Adjusted position for thicker line */
  left: -15px;
  width: calc(100% + 30px);
  height: 25px; /* Increased height for thicker line */
  overflow: visible;
`;

const UnderlinePath = styled.path`
  fill: none;
  stroke: #E99900;
  stroke-width: 7px; /* Significantly increased thickness */
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 350;
  stroke-dashoffset: 350;
  animation: ${drawUnderline} 1.5s ease-out forwards;
`;

const HeroSection: React.FC = () => {
  return (
    <HeroContainer>
      <Header />
      <HeroTitle>
        Certains gestes semblent{" "}
        <HighlightedText>anodins</HighlightedText>
        , <br />
        pour moi c'est un <HighlightedTextOrange>défi quotidien</HighlightedTextOrange>
      </HeroTitle>
    </HeroContainer>
  );
};

export default HeroSection; 