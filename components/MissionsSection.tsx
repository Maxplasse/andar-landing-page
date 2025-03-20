import React from 'react';
import styled from 'styled-components';
import Image from 'next/image';

const MissionsContainer = styled.section`
  background-color: var(--color-secondary);
  padding: 80px 20px;
  color: var(--color-white);
  overflow-x: hidden;
`;

const MissionsContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const MissionsTitle = styled.h2`
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 45px;
  line-height: 1.21;
  margin-bottom: 60px;
  text-align: center;
`;

const MissionsGrid = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: nowrap;
  gap: 10px;
  
  @media (max-width: 992px) {
    flex-direction: column;
    align-items: center;
    gap: 30px;
    overflow-x: hidden;
    padding-bottom: 0;
  }
`;

const MissionItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 23%;
  min-width: 220px;
  height: 240px;
  position: relative;
  
  @media (max-width: 1200px) {
    min-width: 200px;
  }
  
  @media (max-width: 992px) {
    width: 100%;
    max-width: 300px;
    min-width: unset;
    height: 240px;
  }
`;

const IrregularShape = styled.div<{ bgColor: string }>`
  position: absolute;
  background-color: ${props => props.bgColor};
  width: 180px;
  height: 180px;
  border-radius: 42% 58% 72% 28% / 47% 31% 69% 53%;
  z-index: 1;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -40%);
  
  @media (max-width: 1200px) {
    width: 160px;
    height: 160px;
  }
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const IconContainer = styled.div`
  width: 60px;
  height: 60px;
  position: relative;
  margin-bottom: 10px;
  z-index: 5;
`;

const MissionTitle = styled.h3`
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 600;
  margin: 8px 0;
  color: white;
`;

const MissionText = styled.p`
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  padding: 0 5px;
  color: white;
  max-width: 170px;
`;

const MissionsSection: React.FC = () => {
  const missions = [
    {
      icon: '/images/picto_antenne.png',
      title: 'Information',
      description: 'Diffuser une information fiable et actualisée',
      color: '#E69A00', // Orange
      shapeStyle: '42% 58% 72% 28% / 47% 31% 69% 53%' // Unique irregular shape
    },
    {
      icon: '/images/picto_dialogue.png',
      title: 'Dialogue',
      description: 'Faciliter le dialogue avec les soignants',
      color: '#F4D03F', // Yellow
      shapeStyle: '63% 37% 31% 69% / 57% 59% 41% 43%' // Unique irregular shape
    },
    {
      icon: '/images/picto_droits.png',
      title: 'Droits',
      description: 'Défendre les droits des malades',
      color: '#D14D72', // Pink
      shapeStyle: '37% 63% 56% 44% / 27% 74% 26% 73%' // Unique irregular shape
    },
    {
      icon: '/images/picto_microscope.png',
      title: 'Recherche',
      description: 'Soutenir la recherche médicale',
      color: '#AB1851', // Burgundy
      shapeStyle: '54% 46% 39% 61% / 65% 31% 69% 35%' // Unique irregular shape
    }
  ];

  return (
    <MissionsContainer>
      <MissionsContent>
        <MissionsTitle>Nos missions</MissionsTitle>
        <MissionsGrid>
          {missions.map((mission, index) => (
            <MissionItem key={index}>
              <IrregularShape 
                bgColor={mission.color} 
                style={{ borderRadius: mission.shapeStyle }} 
              />
              <ContentWrapper>
                <IconContainer>
                  <Image 
                    src={mission.icon} 
                    alt={mission.title}
                    fill
                    sizes="60px"
                    priority
                    style={{ objectFit: 'contain' }}
                  />
                </IconContainer>
                <MissionTitle>{mission.title}</MissionTitle>
                <MissionText>{mission.description}</MissionText>
              </ContentWrapper>
            </MissionItem>
          ))}
        </MissionsGrid>
      </MissionsContent>
    </MissionsContainer>
  );
};

export default MissionsSection; 