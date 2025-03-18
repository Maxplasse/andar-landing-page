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

const SubSectionTitle = styled.h3`
  font-size: 1.2rem;
  color: var(--color-primary);
  margin: 20px 0 10px;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const Paragraph = styled.p`
  margin-bottom: 15px;
  line-height: 1.6;
`;

const List = styled.ul`
  margin-left: 20px;
  margin-bottom: 15px;
`;

const ListItem = styled.li`
  margin-bottom: 8px;
  line-height: 1.6;
`;

export default function GestionDesCookies() {
  return (
    <PageContainer>
      <Head>
        <title>Gestion des cookies | ANDAR</title>
        <meta name="description" content="Gestion des cookies sur le site de l'ANDAR, Association nationale de défense contre la polyarthrite rhumatoïde." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <LegalPageHeader />
      
      <PolicyContainer>
        <BackToHome />
        <PageTitle>Gestion des cookies</PageTitle>
        
        <SectionTitle>Qu'est-ce qu'un cookie ?</SectionTitle>
        <Paragraph>
          Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette ou mobile) lors de votre visite sur notre site web. Il nous permet de stocker des informations relatives à votre navigation et de vous proposer des services personnalisés.
        </Paragraph>
        
        <SectionTitle>Les cookies que nous utilisons</SectionTitle>
        <Paragraph>
          Sur notre site, nous utilisons différents types de cookies pour améliorer votre expérience de navigation et optimiser le fonctionnement de notre site :
        </Paragraph>
        
        <SubSectionTitle>Cookies strictement nécessaires</SubSectionTitle>
        <Paragraph>
          Ces cookies sont indispensables au fonctionnement du site. Ils vous permettent d'utiliser les principales fonctionnalités du site (par exemple, l'accès à votre compte). Sans ces cookies, vous ne pourrez pas utiliser le site normalement.
        </Paragraph>
        
        <SubSectionTitle>Cookies fonctionnels</SubSectionTitle>
        <Paragraph>
          Ces cookies permettent de mémoriser vos préférences, vos choix afin de vous offrir une expérience personnalisée (par exemple, la mémorisation de votre langue préférée).
        </Paragraph>
        
        <SubSectionTitle>Cookies analytiques ou de performance</SubSectionTitle>
        <Paragraph>
          Ces cookies collectent des informations sur votre utilisation du site, comme les pages que vous visitez le plus souvent. Ces données nous permettent d'optimiser et d'améliorer notre site. Ces cookies sont généralement déposés par des outils d'analyse comme Google Analytics.
        </Paragraph>
        
        <SectionTitle>Comment gérer les cookies ?</SectionTitle>
        <Paragraph>
          Vous pouvez à tout moment choisir de désactiver ces cookies. Votre navigateur peut être paramétré pour vous signaler les cookies déposés et vous demander de les accepter ou non.
        </Paragraph>
        
        <Paragraph>
          Vous pouvez accepter ou refuser les cookies au cas par cas ou les refuser systématiquement. Nous vous rappelons que le paramétrage est susceptible de modifier vos conditions d'accès à nos services nécessitant l'utilisation de cookies.
        </Paragraph>
        
        <Paragraph>
          La configuration de chaque navigateur est différente. Elle est décrite dans le menu d'aide de votre navigateur, qui vous permettra de savoir de quelle manière modifier vos souhaits en matière de cookies.
        </Paragraph>
        
        <SubSectionTitle>Pour Google Chrome</SubSectionTitle>
        <Paragraph>
          Cliquez en haut à droite du navigateur sur le pictogramme de menu (symbolisé par trois lignes horizontales). Sélectionnez Paramètres. Cliquez sur Afficher les paramètres avancés. Dans la section « Confidentialité », cliquez sur préférences. Dans l'onglet « Confidentialité », vous pouvez bloquer les cookies.
        </Paragraph>
        
        <SubSectionTitle>Pour Microsoft Edge</SubSectionTitle>
        <Paragraph>
          Cliquez en haut à droite du navigateur sur le pictogramme de menu (symbolisé par trois points). Sélectionnez Paramètres. Cliquez sur "Cookies et autorisations de site". Vous pourrez alors gérer vos paramètres de cookies.
        </Paragraph>
        
        <SubSectionTitle>Pour Mozilla Firefox</SubSectionTitle>
        <Paragraph>
          En haut de la fenêtre du navigateur, cliquez sur le bouton Firefox, puis aller dans l'onglet Options. Cliquer sur l'onglet Vie privée. Paramétrez les Règles de conservation sur : utiliser les paramètres personnalisés pour l'historique. Vous pourrez alors gérer vos cookies.
        </Paragraph>
        
        <SubSectionTitle>Pour Safari</SubSectionTitle>
        <Paragraph>
          Cliquez en haut à droite du navigateur sur le pictogramme de menu (symbolisé par un rouage). Sélectionnez Paramètres. Cliquez sur "Confidentialité". Vous pourrez alors gérer vos cookies.
        </Paragraph>
        
        <SectionTitle>Durée de conservation des cookies</SectionTitle>
        <Paragraph>
          Conformément aux recommandations de la CNIL, la durée maximale de conservation des cookies est de 13 mois au maximum après leur premier dépôt dans votre terminal. Cette durée n'est pas prolongée à chaque visite. Votre consentement est donc à nouveau requis à l'issue de ce délai.
        </Paragraph>
        
        <SectionTitle>Plus d'informations sur les cookies</SectionTitle>
        <Paragraph>
          Sur le site de la CNIL : <a href="https://www.cnil.fr/fr/cookies-les-outils-pour-les-maitriser" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>https://www.cnil.fr/fr/cookies-les-outils-pour-les-maitriser</a>
        </Paragraph>
      </PolicyContainer>
      <LegalFooter />
    </PageContainer>
  );
} 