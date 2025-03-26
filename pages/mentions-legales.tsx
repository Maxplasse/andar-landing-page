import React from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import LegalFooter from '@/components/LegalFooter';
import LegalPageHeader from '@/components/LegalPageHeader';
import BackToHome from '@/components/BackToHome';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const PolicyContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px 80px;
  flex: 1;
  
  @media (max-width: 768px) {
    padding: 30px 15px 60px;
  }
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  color: var(--color-primary);
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: var(--color-primary);
  margin: 30px 0 15px;
  
  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
`;

const Paragraph = styled.p`
  margin-bottom: 15px;
  line-height: 1.6;
`;

export default function MentionsLegales() {
  return (
    <PageContainer>
      <Head>
        <title>Mentions Légales | ANDAR</title>
        <meta name="description" content="Mentions légales de l'ANDAR, Association nationale de défense contre la polyarthrite rhumatoïde." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <LegalPageHeader />
      
      <PolicyContainer>
        <BackToHome />
        <PageTitle>Mentions Légales</PageTitle>
        
        <SectionTitle>Éditeur du site</SectionTitle>
        <Paragraph>
          <strong>ANDAR - Association Nationale de Défense contre la Polyarthrite Rhumatoïde</strong><br />
          Le Scribe, Bâtiment A<br />
          160 avenue de Fès<br />
          34080 MONTPELLIER<br /><br />
          
          Tél : 04 11 28 03 10<br />
          Email : andar@polyarthrite-andar.com<br />
          Association loi 1901
        </Paragraph>
        
        <SectionTitle>Directeur de la publication</SectionTitle>
        <Paragraph>
          Président de l'ANDAR
        </Paragraph>
        
        <SectionTitle>Conception et réalisation</SectionTitle>
        <Paragraph>
          <strong>Digilityx</strong><br />
          25 Rue Drouot<br />
          75009 Paris<br /><br />

          Email : info@digilityx.com
        </Paragraph>
        
        <SectionTitle>Hébergement</SectionTitle>
        <Paragraph>
        Ce site est hébergé par la société à responsabilité limitée ALWAYSDATA, ayant son siège social au 62 rue Tiquetonne, 75002 Paris (tél. +33 1 84 16 23 40).        </Paragraph>
        
        <SectionTitle>Propriété intellectuelle</SectionTitle>
        <Paragraph>
          L'ensemble du contenu de ce site (textes, images, vidéos, etc.) est la propriété exclusive de l'ANDAR ou de ses partenaires. Toute reproduction, représentation, diffusion ou redistribution, totale ou partielle du contenu de ce site par quelque procédé que ce soit sans l'autorisation expresse et préalable de l'ANDAR est interdite et constitue une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
        </Paragraph>
        
        <SectionTitle>Protection des données personnelles</SectionTitle>
        <Paragraph>
          Conformément à la loi « Informatique et Libertés » du 6 janvier 1978 modifiée et au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité des données vous concernant, ainsi que d'un droit d'opposition et de limitation du traitement. Vous pouvez exercer ces droits en adressant un courrier à l'ANDAR, Le Scribe, Bâtiment A, 160 avenue de Fès, 34080 MONTPELLIER ou par email à andar@polyarthrite-andar.com.
        </Paragraph>
        
        <Paragraph>
          Pour plus d'informations sur la gestion de vos données personnelles, veuillez consulter notre <a href="/politique-de-confidentialite" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Politique de confidentialité</a>.
        </Paragraph>
      </PolicyContainer>
      <LegalFooter />
    </PageContainer>
  );
} 