import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Building, Home as HomeIcon, Briefcase, Award, Mail, Phone, MapPin, Star, ChevronRight } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import { featuredProperties, testimonials } from '../data/properties';

const Home = () => {
  const [email, setEmail] = useState('');
  
  const stats = [
    { id: 1, value: "2,500+", label: "Properties Sold" },
    { id: 2, value: "98%", label: "Client Satisfaction" },
    { id: 3, value: "15+", label: "Years of Experience" },
    { id: 4, value: "$1.2B+", label: "Sales Volume" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would send the email to your newsletter service
    console.log(`Subscribing email: ${email}`);
    setEmail('');
    // Here you would typically show a success message
  };

  return (
    <div className="bg-white">
      {/* Hero Section with subtle animation */}
      <section className="relative h-screen">
        <div 
          className="absolute inset-0 bg-cover bg-center animate-in fade-in duration-1000" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/40"></div>
        </div>
        
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center animate-in slide-in-from-bottom duration-700">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight animate-in slide-in-from-left duration-700 delay-200">
              Find Your <span className="text-blue-400">Dream Home</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 animate-in slide-in-from-left duration-700 delay-300">
              Discover the perfect property that matches your lifestyle and aspirations with our exclusive listings.
            </p>
            
            <div className="bg-white/95 backdrop-blur-md p-5 rounded-xl shadow-2xl animate-in slide-in-from-left duration-700 delay-400">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-grow">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Enter an address, city, or ZIP code" 
                      className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div className="flex space-x-4">
                  <Link to="/buy" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-8 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg active:scale-[0.98]">
                    Buy
                  </Link>
                  <Link to="/rent" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 px-8 rounded-lg font-medium transition-all shadow-md hover:shadow-lg active:scale-[0.98]">
                    Rent
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat) => (
              <div key={stat.id} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties with enhanced cards */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div>
              <span className="inline-block text-blue-600 font-medium mb-2">Exclusive Listings</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Featured Properties</h2>
              <p className="text-gray-600 mt-2 max-w-2xl">Explore our handpicked selection of premium properties in the most desirable locations</p>
            </div>
            <Link to="/buy" className="group flex items-center text-blue-600 hover:text-blue-700 font-medium mt-4 md:mt-0">
              View All 
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us with subtle hover effects */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-block text-blue-600 font-medium mb-2">Our Advantages</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose PROPERTPRO</h2>
            <p className="text-gray-600">We provide an exceptional real estate experience with personalized service and unmatched expertise.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-50 p-8 rounded-xl text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 transform transition-transform hover:scale-110 duration-300">
                <HomeIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Premium Properties</h3>
              <p className="text-gray-600">Access to exclusive listings and luxury properties not available elsewhere.</p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-xl text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 transform transition-transform hover:scale-110 duration-300">
                <Building className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Expert Guidance</h3>
              <p className="text-gray-600">Our team of experienced agents provides personalized advice and support.</p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-xl text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 transform transition-transform hover:scale-110 duration-300">
                <Briefcase className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Investment Insights</h3>
              <p className="text-gray-600">Strategic investment advice to maximize your property portfolio returns.</p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-xl text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 transform transition-transform hover:scale-110 duration-300">
                <Award className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Concierge Service</h3>
              <p className="text-gray-600">White-glove service from property search to closing and beyond.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Form Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-12 text-white">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">We Value Your Feedback</h2>
                <p className="mb-6 text-white/90">
                  Your opinions help us improve our services and provide a better experience for all our clients.
                </p>
                
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <Phone className="h-5 w-5 mr-3 text-blue-300" />
                    <span>+1 (800) 123-4567</span>
                  </div>
                  <div className="flex items-center mb-3">
                    <Mail className="h-5 w-5 mr-3 text-blue-300" />
                    <span>support@propertypro.com</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-3 text-blue-300" />
                    <span>123 Real Estate Ave, New York, NY 10001</span>
                  </div>
                </div>
              </div>
              
              <div className="md:w-1/2 p-8 md:p-12">
                <form className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="john@example.com"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Message
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Share your feedback or ask a question..."
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560520031-3a4dc4e9de0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1073&q=80')] bg-cover bg-center opacity-10"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <span className="inline-block bg-white/20 backdrop-blur-md text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
            Take The Next Step
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to Find Your Perfect Property?</h2>
          <p className="text-white/90 text-xl max-w-2xl mx-auto mb-8">
            Whether you're looking to buy, rent, or invest, our team is here to help you every step of the way.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/buy" className="group bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl flex items-center justify-center">
              Browse Properties
              <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/contact" className="group bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl flex items-center justify-center">
              Contact an Agent
              <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
