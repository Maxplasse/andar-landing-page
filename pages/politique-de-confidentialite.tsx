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

const List = styled.ul`
  margin-left: 20px;
  margin-bottom: 15px;
`;

const ListItem = styled.li`
  margin-bottom: 8px;
  line-height: 1.6;
`;

export default function PolitiqueDeConfidentialite() {
  return (
    <PageContainer>
      <Head>
        <title>Politique de confidentialité | ANDAR</title>
        <meta name="description" content="Politique de confidentialité de l'ANDAR, Association nationale de défense contre la polyarthrite rhumatoïde." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <LegalPageHeader />
      
      <PolicyContainer>
        <BackToHome />
        <PageTitle>Politique de confidentialité</PageTitle>
        
        <SectionTitle>1. Présentation du site.</SectionTitle>
        <Paragraph>
          En vertu de l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, il est précisé aux utilisateurs du site soutenir-polyarthrite.fr l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi :
        </Paragraph>
        
        <Paragraph><strong>Edition</strong><br />
          ANDAR<br />
          Le Scribe, Bâtiment A<br />
          160 avenue de Fès<br />
          34080 MONTPELLIER
        </Paragraph>
        
        <Paragraph>
          Tél : 04 11 28 03 10<br />
          Mail : andar@polyarthrite-andar.com
        </Paragraph>
        
        <Paragraph><strong>Conception</strong><br />
          Digilityx<br />
          25 Rue Drouot<br />
          75009 Paris<br />
          Mail : info@digilityx.com
        </Paragraph>
        
        <Paragraph><strong>Hébergement</strong><br />
        Ce site est hébergé par la société Vercel Inc., ayant son siège social au 340 S Lemon Ave #4133, Walnut, CA 91789, USA.
        </Paragraph>
        
        <SectionTitle>2. Conditions générales d'utilisation du site et des services proposés.</SectionTitle>
        <Paragraph>
          L'utilisation du site soutenir-polyarthrite.fr implique l'acceptation pleine et entière des conditions générales d'utilisation décrites ci-après. Ces conditions d'utilisation sont susceptibles d'être modifiées ou complétées à tout moment, les utilisateurs du site soutenir-polyarthrite.fr sont donc invités à les consulter de manière régulière.
        </Paragraph>
        
        <Paragraph>
          Ce site est normalement accessible à tout moment aux utilisateurs. Une interruption pour raison de maintenance technique peut être toutefois décidée par l'ANDAR, qui s'efforcera alors de communiquer préalablement aux utilisateurs les dates et heures de l'intervention.
        </Paragraph>
        
        <Paragraph>
          Le site soutenir-polyarthrite.fr est mis à jour régulièrement. De la même façon, les mentions légales peuvent être modifiées à tout moment : elles s'imposent néanmoins à l'utilisateur qui est invité à s'y référer le plus souvent possible afin d'en prendre connaissance.
        </Paragraph>
        
        <SectionTitle>3. Description des services fournis.</SectionTitle>
        <Paragraph>
          Le site soutenir-polyarthrite.fr a pour objet de fournir une information concernant les activités de l'ANDAR. Il vise également à promouvoir les dons pour soutenir ces activités.
        </Paragraph>
        
        <Paragraph>
          L'ANDAR s'efforce de fournir sur le site soutenir-polyarthrite.fr des informations aussi précises que possible. Toutefois, il ne pourra être tenu responsable des omissions, des inexactitudes et des carences dans la mise à jour, qu'elles soient de son fait ou du fait des tiers partenaires qui lui fournissent ces informations.
        </Paragraph>
        
        <Paragraph>
          Tous les informations indiquées sur le site soutenir-polyarthrite.fr sont données à titre indicatif, et sont susceptibles d'évoluer. Par ailleurs, les renseignements figurant sur le site soutenir-polyarthrite.fr ne sont pas exhaustifs. Ils sont donnés sous réserve de modifications ayant été apportées depuis leur mise en ligne.
        </Paragraph>
        
        <SectionTitle>4. Compatibilité navigateur</SectionTitle>
        <Paragraph>
          Nous garantissons la compatibilité du site et de son administration avec les navigateurs suivants :
        </Paragraph>
        
        <List>
          <ListItem>Chrome (dernière versions)</ListItem>
          <ListItem>Edge</ListItem>
          <ListItem>Firefox (dernières versions)</ListItem>
          <ListItem>Safari (dernières versions)</ListItem>
          <ListItem>Opéra (dernières versions).</ListItem>
        </List>
        
        <Paragraph>
          Pour les autres navigateurs, nous ne pouvons garantir une présentation graphique et un fonctionnement identiques.
        </Paragraph>
        
        <SectionTitle>5. Limitations contractuelles sur les données techniques.</SectionTitle>
        <Paragraph>
          Le site utilise la technologie JavaScript.
        </Paragraph>
        
        <Paragraph>
          Le site Internet ne pourra être tenu responsable de dommages matériels liés à l'utilisation du site. De plus, l'utilisateur du site s'engage à accéder au site en utilisant un matériel récent, ne contenant pas de virus et avec un navigateur de dernière génération mis-à-jour.
        </Paragraph>
        
        <SectionTitle>6. Propriété intellectuelle et contrefaçons.</SectionTitle>
        <Paragraph>
          L'ANDAR est propriétaire des droits de propriété intellectuelle ou détient les droits d'usage sur tous les éléments accessibles sur le site, notamment les textes, images, graphismes, logo, icônes, sons, logiciels.
        </Paragraph>
        
        <Paragraph>
          Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite de l'ANDAR.
        </Paragraph>
        
        <Paragraph>
          Toute exploitation non autorisée du site ou de l'un quelconque des éléments qu'il contient sera considérée comme constitutive d'une contrefaçon et poursuivie conformément aux dispositions des articles L.335-2 et suivants du Code de Propriété Intellectuelle.
        </Paragraph>
        
        <SectionTitle>7. Limitations de responsabilité.</SectionTitle>
        <Paragraph>
          L'ANDAR ne pourra être tenu responsable des dommages directs et indirects causés au matériel de l'utilisateur, lors de l'accès au site soutenir-polyarthrite.fr, et résultant soit de l'utilisation d'un matériel ne répondant pas aux spécifications indiquées au point 4, soit de l'apparition d'un bug ou d'une incompatibilité.
        </Paragraph>
        
        <Paragraph>
          Des espaces interactifs (possibilité de poser des questions dans l'espace contact) sont à la disposition des utilisateurs. L'ANDAR se réserve le droit de supprimer, sans mise en demeure préalable, tout contenu déposé dans cet espace qui contreviendrait à la législation applicable en France, en particulier aux dispositions relatives à la protection des données. Le cas échéant, l'ANDAR se réserve également la possibilité de mettre en cause la responsabilité civile et/ou pénale de l'utilisateur, notamment en cas de message à caractère raciste, injurieux, diffamant, ou pornographique, quel que soit le support utilisé (texte, photographie…).
        </Paragraph>
        
        <SectionTitle>8. Gestion des données personnelles.</SectionTitle>
        <Paragraph>
          En France, les données personnelles sont notamment protégées par la loi n° 78-87 du 6 janvier 1978, la loi n° 2004-801 du 6 août 2004, l'article L. 226-13 du Code pénal et la Directive Européenne du 24 octobre 1995.
        </Paragraph>
        
        <Paragraph>
          À l'occasion de l'utilisation du site soutenir-polyarthrite.fr, peuvent être recueillies les données suivantes : l'URL des liens par l'intermédiaire desquels l'utilisateur a accédé au site soutenir-polyarthrite.fr, le fournisseur d'accès de l'utilisateur, l'adresse de protocole Internet (IP) de l'utilisateur.
        </Paragraph>
        
        <Paragraph>
          En tout état de cause l'ANDAR ne collecte des informations personnelles relatives à l'utilisateur que pour le besoin de certains services proposés par le site soutenir-polyarthrite.fr. L'utilisateur fournit ces informations en toute connaissance de cause, notamment lorsqu'il procède par lui-même à leur saisie. Il est alors précisé à l'utilisateur du site soutenir-polyarthrite.fr l'obligation ou non de fournir ces informations.
        </Paragraph>
        
        <Paragraph>
          Conformément aux dispositions des articles 38 et suivants de la loi 78-17 du 6 janvier 1978 relative à l'informatique, aux fichiers et aux libertés, tout utilisateur dispose d'un droit d'accès, de rectification et d'opposition aux données personnelles le concernant, en effectuant sa demande écrite et signée, accompagnée d'une copie du titre d'identité avec signature du titulaire de la pièce, en précisant l'adresse à laquelle la réponse doit être envoyée.
        </Paragraph>
        
        <Paragraph>
          Aucune information personnelle de l'utilisateur du site soutenir-polyarthrite.fr n'est publiée à l'insu de l'utilisateur, échangée, transférée, cédée ou vendue sur un support quelconque à des tiers.
        </Paragraph>
        
        <Paragraph>
          Les bases de données sont protégées par les dispositions de la loi du 1er juillet 1998 transposant la directive 96/9 du 11 mars 1996 relative à la protection juridique des bases de données.
        </Paragraph>
        
        <SectionTitle>9. Liens hypertextes et cookies.</SectionTitle>
        <Paragraph>
          Le site soutenir-polyarthrite.fr contient un certain nombre de liens hypertextes vers d'autres sites, mis en place avec l'autorisation de l'ANDAR. Cependant, ce dernier n'a pas la possibilité de vérifier le contenu des sites ainsi visités, et n'assumera en conséquence aucune responsabilité de ce fait.
        </Paragraph>
        
        <Paragraph>
          La navigation sur le site soutenir-polyarthrite.fr est susceptible de provoquer l'installation de cookie(s) sur l'ordinateur de l'utilisateur. Un cookie est un fichier de petite taille, qui ne permet pas l'identification de l'utilisateur, mais qui enregistre des informations relatives à la navigation d'un ordinateur sur un site. Les données ainsi obtenues visent à faciliter la navigation ultérieure sur le site, et ont également vocation à permettre diverses mesures de fréquentation.
        </Paragraph>
        
        <Paragraph>
          Le refus d'installation d'un cookie peut entraîner l'impossibilité d'accéder à certains services. L'utilisateur peut toutefois configurer son ordinateur de la manière suivante, pour refuser l'installation des cookies :
        </Paragraph>
        
        <List>
          <ListItem>Sous Internet Explorer : onglet outil (pictogramme en forme de rouage en haut à droite) / options internet. Cliquez sur Confidentialité et choisissez Bloquer tous les cookies. Validez sur Ok.</ListItem>
          <ListItem>Sous Firefox : en haut de la fenêtre du navigateur, cliquez sur le bouton Firefox, puis aller dans l'onglet Options. Cliquer sur l'onglet Vie privée. Paramétrez les Règles de conservation sur : utiliser les paramètres personnalisés pour l'historique. Enfin décochez-la pour désactiver les cookies.</ListItem>
          <ListItem>Sous Safari : Cliquez en haut à droite du navigateur sur le pictogramme de menu (symbolisé par un rouage). Sélectionnez Paramètres. Cliquez sur Afficher les paramètres avancés. Dans la section « Confidentialité », cliquez sur Paramètres de contenu. Dans la section « Cookies », vous pouvez bloquer les cookies.</ListItem>
          <ListItem>Sous Chrome : Cliquez en haut à droite du navigateur sur le pictogramme de menu (symbolisé par trois lignes horizontales). Sélectionnez Paramètres. Cliquez sur Afficher les paramètres avancés. Dans la section « Confidentialité », cliquez sur préférences. Dans l'onglet « Confidentialité », vous pouvez bloquer les cookies.</ListItem>
        </List>
        
        <SectionTitle>10. Droit applicable et attribution de juridiction.</SectionTitle>
        <Paragraph>
          Tout litige en relation avec l'utilisation du site soutenir-polyarthrite.fr est soumis au droit français. Il est fait attribution exclusive de juridiction aux tribunaux compétents.
        </Paragraph>
        
        <SectionTitle>11. Les principales lois concernées.</SectionTitle>
        <Paragraph>
          Loi n° 78-17 du 6 janvier 1978, notamment modifiée par la loi n° 2004-801 du 6 août 2004 relative à l'informatique, aux fichiers et aux libertés.
        </Paragraph>
        
        <Paragraph>
          Loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique.
        </Paragraph>
        
        <SectionTitle>12. Lexique.</SectionTitle>
        <Paragraph>
          Utilisateur : Internaute se connectant, utilisant le site susnommé.
        </Paragraph>
        
        <Paragraph>
          Informations personnelles : « les informations qui permettent, sous quelque forme que ce soit, directement ou non, l'identification des personnes physiques auxquelles elles s'appliquent » (article 4 de la loi n° 78-17 du 6 janvier 1978)
        </Paragraph>
      </PolicyContainer>
      <LegalFooter />
    </PageContainer>
  );
} 