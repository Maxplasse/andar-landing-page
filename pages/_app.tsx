import React, { useEffect } from 'react'
import type { AppProps } from 'next/app'
import '@/styles/globals.css'
import { createGlobalStyle } from 'styled-components'

// Add visibility enhancement but keep it simple
const GlobalStyle = createGlobalStyle`
  #andar-membership {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
`

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Just a minimal force visibility approach
    setTimeout(() => {
      const adhesionSection = document.getElementById('andar-membership');
      if (adhesionSection) {
        adhesionSection.style.cssText = `
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        `;
      }
    }, 500);
  }, []);
  
  return (
    <>
      <GlobalStyle />
      <Component {...pageProps} />
    </>
  )
} 