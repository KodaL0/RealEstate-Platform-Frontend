import React from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';

const CookiePolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
          {/* Logo Centered */}
          <div className="flex justify-center items-center mb-6">
            <Link to="/" className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                PROPERTPRO
              </span>
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Cookie Policy</h1>

          <div className="space-y-6 text-gray-600">
            <p>
              This Cookie Policy explains how PropertPro ("we", "our", or "us") uses cookies and similar technologies 
              to recognize you when you visit our website. It explains what these technologies are and why we use them, 
              as well as your rights to control our use of them.
            </p>

            <h2 className="text-xl font-semibold text-gray-800">What Are Cookies?</h2>
            <p>
              Cookies are small data files that are placed on your computer or mobile device when you visit a website. 
              Cookies are widely used by website owners to make their websites work, or to work more efficiently, 
              as well as to provide reporting information.
            </p>

            <h2 className="text-xl font-semibold text-gray-800">Why We Use Cookies</h2>
            <p>
              We use cookies for several reasons, including to improve your browsing experience, to understand 
              how our website is being used, and to help customize content and advertisements. The types of cookies we use include:
            </p>
            <ul className="list-disc list-inside ml-4">
              <li><strong>Essential Cookies:</strong> Necessary for the operation of our site.</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our site.</li>
              <li><strong>Functional Cookies:</strong> Enhance functionality and personalization.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-800">Your Choices</h2>
            <p>
              You have the right to decide whether to accept or reject cookies. You can set or amend your web browser 
              controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website, 
              though some functionality may be limited.
            </p>

            <h2 className="text-xl font-semibold text-gray-800">Changes to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes to the cookies we use or for other 
              operational, legal, or regulatory reasons. Please revisit this page regularly to stay informed.
            </p>

            <p>
              If you have any questions about our use of cookies, please contact us at{' '}
              <a href="mailto:support@propertpro.com" className="text-blue-600 underline">support@propertpro.com</a>.
            </p>

            <p className="text-center font-medium text-gray-700">
              Your privacy matters to us. Thank you for trusting PropertPro.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
