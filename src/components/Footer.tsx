import { Link } from 'react-router-dom';
import { Home, Mail, Phone, Instagram, Facebook, Twitter, Linkedin, Building2 } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Building2 className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-400 bg-clip-text text-transparent">PROPERTPRO</span>
            </div>
            <p className="text-gray-400 mb-6">
              Providing exceptional real estate services with a focus on properties and personalized client experiences.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link to="/" className="text-gray-400 hover:text-blue-500 transition-colors">Home</Link></li>
              <li><Link to="/buy" className="text-gray-400 hover:text-blue-500 transition-colors">Buy</Link></li>
              <li><Link to="/rent" className="text-gray-400 hover:text-blue-500 transition-colors">Rent</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-blue-500 transition-colors">About Us</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-blue-500 transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">Services</h3>
            <ul className="space-y-3">
              <li><Link to="#" className="text-gray-400 hover:text-blue-500 transition-colors">Property Valuation</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-blue-500 transition-colors">Mortgage Calculator</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-blue-500 transition-colors">Property Management </Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-blue-500 transition-colors">Investment Advisory</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-blue-500 transition-colors">Market Analysis</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <Phone className="h-5 w-5 text-blue-500 mr-3 mt-1" />
                <span className="text-gray-400">+357 94046844</span>
              </li>
              <li className="flex items-start">
                <Mail className="h-5 w-5 text-blue-500 mr-3 mt-1" />
                <span className="text-gray-400">contact@propertpro.com</span>
              </li>
              <li className="flex items-start">
                <Home className="h-5 w-5 text-blue-500 mr-3 mt-1" />
                <span className="text-gray-400">
                  Cyprus<br />
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} PROPERTPRO. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link to="#" className="text-gray-500 hover:text-gray-400 text-sm">Privacy Policy</Link>
            <Link to="#" className="text-gray-500 hover:text-gray-400 text-sm">Terms of Service</Link>
            <Link to="#" className="text-gray-500 hover:text-gray-400 text-sm">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
