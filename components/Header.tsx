import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import Image from 'next/image';

// Add this interface to define the custom props
interface HeaderContainerProps {
  hidden?: boolean;
  scrolled?: boolean;
}

const HeaderContainer = styled.header<HeaderContainerProps>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 50px;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  transition: transform 0.3s ease, background-color 0.3s ease;
  
  /* These properties will be dynamically applied based on scroll state */
  transform: ${props => props.hidden ? 'translateY(-100%)' : 'translateY(0)'};
  background-color: ${props => props.scrolled ? 'var(--color-secondary)' : 'transparent'};
  
  @media (max-width: 768px) {
    flex-direction: column;
    padding: 15px 20px;
    gap: 15px;
  }
`;

const Logo = styled.div`
  position: relative;
  width: 250px;
  height: 100px;
  
  @media (max-width: 768px) {
    width: 200px;
    height: 80px;
  }
`;

const JoinButton = styled.button`
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: 6px;
  padding: 15px 50px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 22px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    padding: 10px 30px;
    font-size: 18px;
  }
`;

const Header: React.FC = () => {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Function to get the hero section height (viewheight)
    const getHeroHeight = () => {
      const heroElement = document.querySelector('section') as HTMLElement;
      return heroElement ? heroElement.offsetHeight : window.innerHeight;
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const heroHeight = getHeroHeight();
      
      // Hide header when within hero section, show when scrolled past it
      if (currentScrollY < heroHeight) {
        // Within hero section - show header at top, then hide as we scroll down
        setHidden(currentScrollY > 100);
        // No background color while in hero section
        setScrolled(false);
      } else {
        // Scrolled past hero section - always show header with background
        setHidden(false);
        setScrolled(true);
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();
    
    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Function to scroll to the adhesion section
  const scrollToAdhesion = () => {
    const adhesionSection = document.getElementById('adhesion');
    if (adhesionSection) {
      adhesionSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <HeaderContainer hidden={hidden} scrolled={scrolled}>
      <Logo>
        <Image 
          src="/images/logo_andar_blanc.png" 
          alt="ANDAR Logo" 
          fill
          style={{ objectFit: 'contain' }}
        />
      </Logo>
      <JoinButton onClick={scrollToAdhesion}>J'adhère</JoinButton>
    </HeaderContainer>
  );
};

export default Header; 