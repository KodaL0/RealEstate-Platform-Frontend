import React, { useState } from 'react';
import { Printer, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  initiallyExpanded?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, children, initiallyExpanded = false }) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        className="w-full flex justify-between items-center py-4 px-2 text-left font-semibold text-lg hover:bg-gray-50 focus:outline-none transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span>{title}</span>
        {expanded ? <ChevronUp className="h-5 w-5 text-blue-600" /> : <ChevronDown className="h-5 w-5 text-blue-600" />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="py-4 px-2 text-gray-700 space-y-4">{children}</div>
      </div>
    </div>
  );
};

const TermsAndConditions: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  const lastUpdated = "May 15, 2025";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 sm:p-10">
            {/* Logo Inside Container */}
            <div className="flex justify-center items-center mb-6">
              <Link to="/" className="flex items-center space-x-2">
                <Building2 className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                  PROPERTPRO
                </span>
              </Link>
            </div>

            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Terms and Conditions</h1>
              <button
                onClick={handlePrint}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors print:hidden"
              >
                <Printer className="h-5 w-5 mr-2" />
                <span>Print</span>
              </button>
            </div>

            <p className="text-gray-600 mb-8">Last Updated: {lastUpdated}</p>

            <div className="prose prose-blue max-w-none">
              <p className="text-gray-700 mb-6">
                Welcome to PropertPro. Please read these terms and conditions carefully before using our website and services.
                By accessing or using PropertPro, you agree to be bound by these terms and conditions.
              </p>
              
              <div className="space-y-1 mb-8">
                <Section title="1. Acceptance of Terms" initiallyExpanded={true}>
                  <p>
                    By accessing or using the PropertPro website and services (collectively, the "Services"), you agree to be bound by these Terms and Conditions. If you do not agree to all of these terms, you may not access or use our Services.
                  </p>
                  <p>
                    We may modify these Terms and Conditions at any time, and such modifications shall be effective immediately upon posting on the website. Your continued use of the Services following any modifications indicates your acceptance of the modified Terms and Conditions.
                  </p>
                </Section>
                
                <Section title="2. Use of the Services">
                  <p>
                    PropertPro provides an online platform that connects property buyers, sellers, and renters with real estate agents and properties. You may use our Services only as permitted by these Terms and in compliance with all applicable laws and regulations.
                  </p>
                  <p>
                    You agree not to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Use the Services for any illegal purpose or in violation of any local, state, national, or international law.</li>
                    <li>Violate or encourage others to violate the rights of third parties, including intellectual property rights.</li>
                    <li>Post or transmit any content that is unlawful, threatening, abusive, harassing, defamatory, libelous, deceptive, fraudulent, invasive of another's privacy, or contains explicit or graphic descriptions or accounts of sexual acts.</li>
                    <li>Impersonate any person or entity or falsely state or otherwise misrepresent your affiliation with a person or entity.</li>
                    <li>Interfere with or disrupt the Services or servers or networks connected to the Services.</li>
                    <li>Attempt to gain unauthorized access to any portion of the Services, other accounts, computer systems, or networks connected to the Services.</li>
                  </ul>
                </Section>
                
                <Section title="3. Account Registration">
                  <p>
                    To access certain features of the Services, you may be required to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
                  </p>
                  <p>
                    You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify PropertPro immediately of any unauthorized use of your account or any other breach of security.
                  </p>
                  <p>
                    PropertPro reserves the right to terminate or suspend your account at any time for any reason without notice or liability.
                  </p>
                </Section>
                
                <Section title="4. Property Listings and Information">
                  <p>
                    PropertPro strives to provide accurate and up-to-date information about properties listed on our platform. However, we do not guarantee the accuracy, completeness, or reliability of any property listings, descriptions, images, or other content on the Services.
                  </p>
                  <p>
                    Property listings and information are provided by third-party users, including real estate agents, property owners, and other sources. PropertPro is not responsible for verifying the accuracy of such information and does not endorse any properties listed on our platform.
                  </p>
                  <p>
                    You acknowledge and agree that any reliance on property listings and information is at your own risk. We recommend that you independently verify all property information before making any purchase or rental decisions.
                  </p>
                </Section>
                
                <Section title="5. User Content">
                  <p>
                    The Services may allow you to post, submit, or transmit content, including but not limited to property listings, reviews, comments, and messages (collectively, "User Content"). By posting User Content, you grant PropertPro a worldwide, non-exclusive, royalty-free, perpetual, irrevocable, and fully sublicensable right to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, and display such User Content in any media.
                  </p>
                  <p>
                    You represent and warrant that:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You own or have the necessary rights to the User Content you post.</li>
                    <li>The User Content does not infringe upon the intellectual property rights or other rights of any third party.</li>
                    <li>The User Content does not violate these Terms or any applicable law or regulation.</li>
                  </ul>
                  <p>
                    PropertPro has the right, but not the obligation, to monitor, edit, or remove any User Content for any reason without notice.
                  </p>
                </Section>
                
                <Section title="6. Intellectual Property">
                  <p>
                    All content, features, and functionality on the Services, including but not limited to text, graphics, logos, icons, images, audio clips, digital downloads, data compilations, and software, are the exclusive property of PropertPro or its licensors and are protected by copyright, trademark, and other intellectual property laws.
                  </p>
                  <p>
                    You may not copy, reproduce, distribute, modify, create derivative works from, publicly display, publicly perform, republish, download, store, or transmit any content on the Services without the prior written consent of PropertPro or the respective copyright owner.
                  </p>
                  <p>
                    The PropertPro name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of PropertPro or its affiliates. You may not use such marks without the prior written permission of PropertPro.
                  </p>
                </Section>
                
                <Section title="7. Third-Party Links and Services">
                  <p>
                    The Services may contain links to third-party websites, services, or resources that are not owned or controlled by PropertPro. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services.
                  </p>
                  <p>
                    You acknowledge and agree that PropertPro shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods, or services available on or through any third-party websites or services.
                  </p>
                </Section>
                
                <Section title="8. Disclaimer of Warranties">
                  <p>
                    THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
                  </p>
                  <p>
                    PropertPro does not warrant that:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>The Services will function uninterrupted, secure, or available at any particular time or location.</li>
                    <li>Any errors or defects will be corrected.</li>
                    <li>The Services are free of viruses or other harmful components.</li>
                    <li>The results of using the Services will meet your requirements.</li>
                  </ul>
                </Section>
                
                <Section title="9. Limitation of Liability">
                  <p>
                    IN NO EVENT SHALL PROPERTPRO, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Your access to or use of or inability to access or use the Services.</li>
                    <li>Any conduct or content of any third party on the Services.</li>
                    <li>Any content obtained from the Services.</li>
                    <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
                  </ul>
                  <p>
                    The limitation of liability shall apply to the fullest extent permitted by law in the applicable jurisdiction.
                  </p>
                </Section>
                
                <Section title="10. Indemnification">
                  <p>
                    You agree to defend, indemnify, and hold harmless PropertPro, its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney's fees) arising from:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Your use of and access to the Services.</li>
                    <li>Your violation of any term of these Terms and Conditions.</li>
                    <li>Your violation of any third-party right, including without limitation any copyright, property, or privacy right.</li>
                    <li>Any claim that your User Content caused damage to a third party.</li>
                  </ul>
                  <p>
                    This defense and indemnification obligation will survive these Terms and Conditions and your use of the Services.
                  </p>
                </Section>
                
                <Section title="11. Governing Law and Jurisdiction">
                  <p>
                    These Terms and Conditions shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard to its conflict of law provisions.
                  </p>
                  <p>
                    Any legal action or proceeding arising out of or relating to these Terms and Conditions or your use of the Services shall be brought exclusively in the courts of [Jurisdiction], and you consent to the personal jurisdiction of such courts.
                  </p>
                </Section>
                
                <Section title="12. Termination">
                  <p>
                    PropertPro may terminate or suspend your access to the Services immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms and Conditions.
                  </p>
                  <p>
                    Upon termination, your right to use the Services will immediately cease. If you wish to terminate your account, you may simply discontinue using the Services or contact us to request account deletion.
                  </p>
                </Section>
                
                <Section title="13. Changes to Terms and Conditions">
                  <p>
                    PropertPro reserves the right, at its sole discretion, to modify or replace these Terms and Conditions at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                  </p>
                  <p>
                    By continuing to access or use our Services after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Services.
                  </p>
                </Section>
                
                <Section title="14. Contact Information">
                  <p>
                    If you have any questions about these Terms and Conditions, please contact us at:
                  </p>
                  <div className="mt-4">
                    <p><strong>PropertPro</strong></p>
                    <p>Cyprus</p>
                    <p>Nicosia</p>
                    <p>Email: support@propertpro.com</p>
                  </div>
                </Section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
