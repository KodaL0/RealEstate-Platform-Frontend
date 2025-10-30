import { Calendar, User, Clock, Tag } from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  authorAvatar: string;
  publishedDate: string;
  readTime: string;
  imageUrl: string;
  featured: boolean;
}

const mockPosts: BlogPost[] = [
  {
    id: 1,
    title: "Top 10 Neighborhoods for First-Time Homebuyers in 2024",
    excerpt: "Discover the most affordable and family-friendly neighborhoods perfect for your first home purchase.",
    content: "Full article content here...",
    category: "Buying Guide",
    author: "Sarah Mitchell",
    authorAvatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100",
    publishedDate: "2024-03-15",
    readTime: "5 min read",
    imageUrl: "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1200",
    featured: true
  },
  {
    id: 2,
    title: "How to Increase Your Home's Value Before Selling",
    excerpt: "Simple renovations and upgrades that can significantly boost your property's market value.",
    content: "Full article content here...",
    category: "Selling Tips",
    author: "Michael Chen",
    authorAvatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100",
    publishedDate: "2024-03-12",
    readTime: "7 min read",
    imageUrl: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800",
    featured: false
  },
  {
    id: 3,
    title: "Understanding Real Estate Market Trends in 2024",
    excerpt: "An in-depth analysis of current market conditions and what they mean for buyers and sellers.",
    content: "Full article content here...",
    category: "Market Insights",
    author: "Emily Rodriguez",
    authorAvatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100",
    publishedDate: "2024-03-10",
    readTime: "6 min read",
    imageUrl: "https://images.pexels.com/photos/210617/pexels-photo-210617.jpeg?auto=compress&cs=tinysrgb&w=800",
    featured: false
  },
  {
    id: 4,
    title: "The Ultimate Guide to Home Staging",
    excerpt: "Professional tips to make your property irresistible to potential buyers.",
    content: "Full article content here...",
    category: "Selling Tips",
    author: "David Thompson",
    authorAvatar: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100&h=100",
    publishedDate: "2024-03-08",
    readTime: "8 min read",
    imageUrl: "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800",
    featured: false
  },
  {
    id: 5,
    title: "Investment Properties: What You Need to Know",
    excerpt: "Essential insights for those looking to enter the property investment market.",
    content: "Full article content here...",
    category: "Investment",
    author: "Lisa Anderson",
    authorAvatar: "https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg?auto=compress&cs=tinysrgb&w=100&h=100",
    publishedDate: "2024-03-05",
    readTime: "10 min read",
    imageUrl: "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800",
    featured: false
  },
  {
    id: 6,
    title: "Mortgage Pre-Approval: A Step-by-Step Guide",
    excerpt: "Everything you need to know about getting pre-approved for a home loan.",
    content: "Full article content here...",
    category: "Financing",
    author: "James Wilson",
    authorAvatar: "https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=100&h=100",
    publishedDate: "2024-03-03",
    readTime: "6 min read",
    imageUrl: "https://images.pexels.com/photos/4968391/pexels-photo-4968391.jpeg?auto=compress&cs=tinysrgb&w=800",
    featured: false
  }
];

const categories = ["All", "Buying Guide", "Selling Tips", "Market Insights", "Investment", "Financing"];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-gray-900">PropertyPro</h1>
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-gray-900 font-medium hover:text-gray-600 transition">Blog</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition">About</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition">Contact</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900 transition">Search</button>
              <button className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">PropertyPro Insights</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Expert advice, market trends, and insider tips to help you navigate the real estate market with confidence
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {categories.map((category) => (
            <button
              key={category}
              className="px-5 py-2 rounded-full border border-gray-300 text-gray-700 hover:border-gray-900 hover:bg-gray-50 transition font-medium"
            >
              {category}
            </button>
          ))}
        </div>

        {mockPosts.filter(post => post.featured).map((post) => (
          <article key={post.id} className="mb-16 group cursor-pointer">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="overflow-hidden rounded-2xl">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-[400px] object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
              <div className="space-y-4">
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                  {post.category}
                </span>
                <h3 className="text-4xl font-bold text-gray-900 group-hover:text-gray-600 transition">
                  {post.title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <img
                      src={post.authorAvatar}
                      alt={post.author}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="font-medium text-gray-700">{post.author}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(post.publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{post.readTime}</span>
                  </div>
                </div>
                <button className="text-gray-900 font-semibold hover:underline flex items-center space-x-2">
                  <span>Read More</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </article>
        ))}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockPosts.filter(post => !post.featured).map((post) => (
            <article key={post.id} className="group cursor-pointer">
              <div className="overflow-hidden rounded-xl mb-4">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-56 object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full mb-3">
                {post.category}
              </span>
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-600 transition line-clamp-2">
                {post.title}
              </h3>
              <p className="text-gray-600 mb-4 line-clamp-2">
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <img
                    src={post.authorAvatar}
                    alt={post.author}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="font-medium text-gray-700">{post.author}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{post.readTime}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">PropertyPro</h3>
              <p className="text-gray-400">Your trusted partner in real estate excellence.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Guides</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Newsletter</h4>
              <p className="text-gray-400 mb-4">Get the latest real estate insights delivered to your inbox.</p>
              <input
                type="email"
                placeholder="Your email"
                className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-white"
              />
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PropertyPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
