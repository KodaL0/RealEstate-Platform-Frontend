import React from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';

const AboutUs: React.FC = () => {
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

          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">About Us</h1>

          <div className="space-y-6 text-gray-600">
            <p>
              PropertPro is your trusted partner in real estate, dedicated to helping you find the perfect
              property. We’ve just launched PropertPro to help connect buyers, sellers, renters, and agents —
              with a vision to build a platform that truly supports every step of the real estate journey.
            </p>

            <p>
              Our mission is to simplify property transactions and make them transparent, accessible, and user-
              friendly. By using modern technologies, we’re building a seamless experience for every step of
              your real estate journey.
            </p>

            <p>
              We’re a team of two passionate individuals who love what we do and believe in helping people
              find their next home. We've focused our skills to create a platform that supports homeowners,
              realtors, and anyone actively searching for property.
            </p>

            <p>
              But we don’t want to stop there we want to improve continuously, and that’s where you come
              in. Tell us what features would help you most. Share your ideas. Let us know what’s missing. Our
              goal is direct communication and real collaboration with our users to build something truly useful
              together.
            </p>

            <p className="text-center font-medium text-gray-700">
              Help us help you and let’s shape the future of property discovery together.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
