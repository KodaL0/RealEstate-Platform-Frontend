import React from 'react';
import LegalDocumentViewer from '../components/LegalDocumentViewer';

const CookiePolicy: React.FC = () => {
  return <LegalDocumentViewer documentType="cookie_policy" showAcceptButton={false} />;
};

export default CookiePolicy;
