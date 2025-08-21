import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const FooterContainer = styled.footer`
  background: #1e293b;
  color: #fff;
  padding: 2rem 0;
  position: relative;
  bottom: 0;
  width: 100%;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
`;

const FooterSection = styled.div`
  h3 {
    color: #fff;
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
`;

const FooterLink = styled(Link)`
  color: #cbd5e1;
  text-decoration: none;
  display: block;
  margin-bottom: 0.5rem;
  &:hover {
    color: #fff;
  }
`;

const Copyright = styled.div`
  text-align: center;
  padding-top: 2rem;
  color: #cbd5e1;
  border-top: 1px solid #334155;
  margin-top: 2rem;
`;

function Footer() {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterSection>
          <h3>About Us</h3>
          <FooterLink to="/about">Our Story</FooterLink>
          <FooterLink to="/contact">Contact Us</FooterLink>
          <FooterLink to="/careers">Careers</FooterLink>
        </FooterSection>
        <FooterSection>
          <h3>Services</h3>
          <FooterLink to="/properties">Properties</FooterLink>
          <FooterLink to="/maintenance">Maintenance</FooterLink>
          <FooterLink to="/support">Support</FooterLink>
        </FooterSection>
        <FooterSection>
          <h3>Legal</h3>
          <FooterLink to="/privacy">Privacy Policy</FooterLink>
          <FooterLink to="/terms">Terms of Service</FooterLink>
          <FooterLink to="/cookies">Cookie Policy</FooterLink>
        </FooterSection>
      </FooterContent>
      <Copyright>
        © {new Date().getFullYear()} Izzy Tech Real Estate. All rights reserved.
      </Copyright>
    </FooterContainer>
  );
}

export default Footer; 