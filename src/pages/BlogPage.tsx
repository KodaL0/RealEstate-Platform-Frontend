import { Calendar, User, Clock, Tag } from 'lucide-react';
import { useState } from 'react';
import BlogArticle from '../pages/BlogArticle';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  authorAvatar: string;
  authorBio: string;
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
    authorBio: "Sarah is a real estate expert with over 10 years of experience helping first-time homebuyers find their dream homes. She specializes in affordable housing markets and neighborhood analysis.",
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
    authorBio: "Michael is a property investment consultant and renovation specialist who has helped hundreds of homeowners maximize their property value through strategic improvements.",
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
    authorBio: "Emily is a market analyst and economist specializing in residential real estate trends. She provides insights and forecasts to help buyers and sellers make informed decisions.",
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
    authorBio: "David is a certified home staging professional with a background in interior design. He has staged over 500 properties, helping sellers achieve faster sales at premium prices.",
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
    authorBio: "Lisa is a real estate investor and financial advisor who helps clients build wealth through strategic property investments. She manages a portfolio of over 50 rental properties.",
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
    authorBio: "James is a mortgage broker with 15 years of experience in residential lending. He specializes in helping first-time buyers navigate the complex world of home financing.",
    publishedDate: "2024-03-03",
    readTime: "6 min read",
    imageUrl: "https://images.pexels.com/photos/4968391/pexels-photo-4968391.jpeg?auto=compress&cs=tinysrgb&w=800",
    featured: false
  }
];

const categories = ["All", "Buying Guide", "Selling Tips", "Market Insights", "Investment", "Financing"];

export default function BlogPage() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  if (selectedPost) {
    return <BlogArticle post={selectedPost} onBack={() => setSelectedPost(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-6xl font-bold text-gray-900 mb-6 tracking-tight">PropertPro Media</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Expert advice, market trends, and insider tips to help you navigate the real estate market with confidence
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center mb-16">
          {categories.map((category) => (
            <button
              key={category}
              className="px-6 py-2.5 rounded-full border-2 border-gray-200 text-gray-700 hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 font-medium shadow-sm hover:shadow-md"
            >
              {category}
            </button>
          ))}
        </div>

        {mockPosts.filter(post => post.featured).map((post) => (
          <article
            key={post.id}
            onClick={() => setSelectedPost(post)}
            className="mb-20 group cursor-pointer bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
          >
            <div className="grid md:grid-cols-2 gap-0 items-center">
              <div className="overflow-hidden h-full">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-full min-h-[450px] object-cover group-hover:scale-110 transition duration-700"
                />
              </div>
              <div className="p-10 md:p-12 space-y-5">
                <span className="inline-block px-4 py-1.5 bg-gray-900 text-white text-sm font-semibold rounded-full">
                  {post.category}
                </span>
                <h3 className="text-4xl font-bold text-gray-900 group-hover:text-gray-700 transition leading-tight">
                  {post.title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pt-2">
                  <div className="flex items-center space-x-2">
                    <img
                      src={post.authorAvatar}
                      alt={post.author}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100"
                    />
                    <span className="font-semibold text-gray-700">{post.author}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(post.publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{post.readTime}</span>
                  </div>
                </div>
                <button className="mt-4 inline-flex items-center space-x-2 text-gray-900 font-bold hover:gap-3 transition-all group/btn">
                  <span>Read Full Article</span>
                  <span className="text-xl group-hover/btn:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </div>
          </article>
        ))}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockPosts.filter(post => !post.featured).map((post) => (
            <article
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="group cursor-pointer bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden"
            >
              <div className="overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-64 object-cover group-hover:scale-110 transition duration-700"
                />
              </div>
              <div className="p-6 space-y-3">
                <span className="inline-block px-3 py-1 bg-gray-900 text-white text-xs font-semibold rounded-full">
                  {post.category}
                </span>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition line-clamp-2 leading-snug">
                  {post.title}
                </h3>
                <p className="text-gray-600 line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <img
                      src={post.authorAvatar}
                      alt={post.author}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100"
                    />
                    <span className="font-semibold text-gray-700">{post.author}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
