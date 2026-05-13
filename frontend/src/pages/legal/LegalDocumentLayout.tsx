import React from 'react';
import './LegalDocument.css';

interface LegalDocumentLayoutProps {
  title: string;
  children: React.ReactNode;
}

const LegalDocumentLayout: React.FC<LegalDocumentLayoutProps> = ({ title, children }) => (
  <main className="legal-document-page py-5">
    <div className="container">
      <article className="legal-document">
        <h1 className="legal-document__title">{title}</h1>
        <p className="legal-document__updated">Última actualización: mayo de 2026</p>
        <div className="legal-document__body">{children}</div>
      </article>
    </div>
  </main>
);

export default LegalDocumentLayout;
