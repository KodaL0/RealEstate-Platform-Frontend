import { Home, Mail, Phone, Instagram, Linkedin, Building2 } from 'lucide-react';

const Footer = () => {
  return (
    <div className="mt-auto">
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white w-full">
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Building2 className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold text-white">PROPERTPRO</span>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Providing exceptional real estate services with a focus on quality properties and personalized client experiences.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://www.instagram.com/propertpro"
                  className="bg-gray-800 p-3 rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-110"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://www.linkedin.com/company/propertpro"
                  className="bg-gray-800 p-3 rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-110"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-bold mb-6 text-white relative inline-block">
                Quick Links
                <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-blue-500"></span>
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="/" className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-blue-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                    Home
                  </a>
                </li>
                <li>
                  <a href="/buy" className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-blue-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                    Buy
                  </a>
                </li>
                <li>
                  <a href="/rent" className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-blue-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                    Rent
                  </a>
                </li>
                <li>
                  <a href="/about" className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-blue-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                    About Us
                  </a>
                </li>
                <li>
                  <a href="/sitemap" className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-blue-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                    Sitemap
                  </a>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-bold mb-6 text-white relative inline-block">
                Services
                <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-blue-500"></span>
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="/mortgage-calculator" className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-blue-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                    Mortgage Calculator
                  </a>
                </li>
                <li>
                  <a href="/rent-vs-buy" className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-blue-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                    Rent vs Buy
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-bold mb-6 text-white relative inline-block">
                Contact Us
                <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-blue-500"></span>
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start group">
                  <Phone className="h-5 w-5 text-blue-400 mr-3 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-gray-300 text-sm leading-relaxed">+357 94007875<br />+357 94046844</span>
                </li>
                <li className="flex items-start group">
                  <Mail className="h-5 w-5 text-blue-400 mr-3 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <a href="mailto:support@propertpro.com" className="text-gray-300 text-sm hover:text-blue-400 transition-colors">
                    support@propertpro.com
                  </a>
                </li>
                <li className="flex items-start group">
                  <Home className="h-5 w-5 text-blue-400 mr-3 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-gray-300 text-sm">Nicosia, Cyprus</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section with Enhanced Legal Links */}
          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} PROPERTPRO. All rights reserved.
              </p>

              {/* Enhanced Legal Links Section */}
              <div className="flex flex-wrap justify-center items-center gap-6">
                <a
                  href="/legal/terms-conditions/"
                  className="text-gray-300 hover:text-blue-400 text-sm font-medium transition-colors duration-200 relative group"
                >
                  Terms & Conditions
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-200"></span>
                </a>
                <span className="text-gray-600">•</span>
                <a
                  href="/legal/privacy-policy/"
                  className="text-gray-300 hover:text-blue-400 text-sm font-medium transition-colors duration-200 relative group"
                >
                  Privacy Policy
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-200"></span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
