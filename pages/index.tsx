import React from 'react';
import Head from 'next/head';
import HeroSection from '@/components/HeroSection';
import IntroSection from '@/components/IntroSection';
import InfoSection from '@/components/InfoSection';
import WhyJoinSection from '@/components/WhyJoinSection';
import MembershipSection from '@/components/MembershipSection';
import TestimonialSection from '@/components/TestimonialSection';
import Footer from '@/components/Footer';
import MissionsSection from '@/components/MissionsSection';
import LegalFooter from '@/components/LegalFooter';

export default function Home() {
  return (
    <>
      <Head>
        <title>ANDAR - Association nationale de défense contre la polyarthrite rhumatoïde</title>
        <meta name="description" content="L'ANDAR, créée par les malades, pour les malades. Association de défense des personnes atteintes de polyarthrite rhumatoïde." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <HeroSection />
        <IntroSection />
        <InfoSection />
        <WhyJoinSection />
        <MembershipSection />
        <TestimonialSection />
        <Footer />
        <MissionsSection />
        <LegalFooter />
      </main>
    </>
  );
} 