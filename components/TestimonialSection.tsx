import React, { useState, useEffect } from 'react';
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
`;

const SectionTitle = styled.h2`
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 42px;
  line-height: 1.21;
  color: var(--color-black);
  margin-bottom: 15px;
  text-align: center;
`;

const HighlightedText = styled.span`
  background-color: #4DB5C5;
  color: white;
  padding: 0 10px;
  border-radius: 4px;
`;

const SourceNote = styled.p`
  font-size: 14px;
  color: #777;
  margin-bottom: 40px;
  font-style: italic;
  text-align: center;
`;

const CarouselContainer = styled.div`
  width: 100%;
  position: relative;
  margin-top: 20px;
`;

const CarouselTrack = styled.div`
  display: flex;
  transition: transform 0.5s ease-in-out;
  width: 100%;
`;

const CarouselSlide = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  width: 100%;
  
  @media (max-width: 992px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TestimonialCard = styled.div`
  padding: 25px;
  background-color: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 100%;
  border-left: 4px solid;
  border-color: ${props => props.color || "#4DB5C5"};
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }
`;

const TestimonialText = styled.p`
  font-family: 'Inclusive Sans', sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: var(--color-black);
  font-style: italic;
  margin-bottom: 20px;
  position: relative;
  padding-left: 20px;
  
  &:before {
    content: '"';
    position: absolute;
    left: 0;
    top: 0;
    font-size: 28px;
    color: #4DB5C5;
    font-family: Georgia, serif;
    line-height: 1;
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
`;

const ControlButton = styled.button`
  background-color: var(--color-primary);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  }
`;

// Testimonials with emphasized words (bold)
const testimonials = [
  "Vous me donnez du <strong>courage</strong> et la <strong>force</strong> de continuer à me battre pour obtenir réparation.",
  
  "Je tiens à vous adresser mes plus sincères <strong>remerciements</strong> pour l'aide précieuse dans ma démarche de <strong>reconnaissance</strong>.",
  
  "Quelle surprise, un <strong>accueil chaleureux</strong>, des personnes comme moi atteintes de la maladie et des <strong>informations précieuses</strong> !",
  
  "En lisant un passage de l'un de vos articles, j'en ai <strong>pleuré</strong> tellement c'est bien décrit. Merci pour votre <strong>dévouement</strong>.",
  
  "Tout simplement merci pour tous les <strong>conseils</strong> et <strong>messages positifs</strong> que vous transmettez.",
  
  "C'est <strong>rassurant</strong> et très utile de pouvoir <strong>compter sur quelqu'un</strong> dans ce dédale de démarches.",
  
  "Un numéro particulièrement bien fait. Merci de toujours nous <strong>« apprendre »</strong> et <strong>« surprendre »</strong> !",
  
  "<strong>Organisation parfaite</strong>, formations et ateliers très formateurs, menés par des intervenants qui ont su nous tenir en haleine.",
  
  "Vous m'avez ouvert à beaucoup de <strong>possibilités</strong> dont ne m'avaient pas parlé mes docteurs pour <strong>soulager mes douleurs</strong>.",
  
  "Dès mon retour du congrès, j'ai trouvé un cours de <strong>Qi Gong</strong> que j'ai suivi toute l'année. Merci pour cette <strong>découverte</strong> !",
  
  "Grâce à vous et au service hospitalier, je mène une <strong>vie normale</strong> malgré une PR depuis <strong>12 ans</strong>.",
  
  "Grâce à vos explications, je me sens désormais <strong>mieux informée</strong> pour discuter <strong>sereinement</strong> avec mon pharmacien."
];

// Color array for the cards
const cardColors = ["#4DB5C5", "#AB1851", "#E99900"];

const TestimonialSection: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(testimonials.length / itemsPerPage);
  
  const handleNext = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };
  
  const handlePrev = () => {
    setCurrentPage((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };
  
  // Get current testimonials
  const getCurrentTestimonials = () => {
    const startIndex = currentPage * itemsPerPage;
    return testimonials.slice(startIndex, startIndex + itemsPerPage);
  };

  return (
    <SectionContainer id="temoignages">
      <SectionTitle>Vos <HighlightedText>témoignages</HighlightedText></SectionTitle>
      <SourceNote>Témoignages extraits de notre revue ANDAR Infos</SourceNote>
      
      <CarouselContainer>
        <CarouselTrack>
          <CarouselSlide>
            {getCurrentTestimonials().map((testimonial, index) => (
              <TestimonialCard 
                key={index} 
                color={cardColors[index % cardColors.length]}
              >
                <TestimonialText dangerouslySetInnerHTML={{ __html: testimonial }} />
              </TestimonialCard>
            ))}
          </CarouselSlide>
        </CarouselTrack>
      </CarouselContainer>
      
      <ButtonWrapper>
        <ControlButton onClick={handlePrev}>
          &#8592;
        </ControlButton>
        <ControlButton onClick={handleNext}>
          &#8594;
        </ControlButton>
      </ButtonWrapper>
    </SectionContainer>
  );
};

export default TestimonialSection; 