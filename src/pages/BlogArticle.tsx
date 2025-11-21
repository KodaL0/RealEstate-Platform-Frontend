import { ArrowLeft, Bookmark, Calendar, Clock, Share2 } from "lucide-react";

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
}

interface BlogArticleProps {
  post: BlogPost;
  onBack: () => void;
}

export default function BlogArticle({ post, onBack }: BlogArticleProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Blog</span>
        </button>

        <article>
          <header className="mb-8">
            <span className="inline-block px-4 py-1.5 bg-gray-900 text-white text-sm font-semibold rounded-full mb-6">
              {post.category}
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">{post.excerpt}</p>

            <div className="flex flex-wrap items-center justify-between gap-6 pb-8 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <img
                  src={post.authorAvatar}
                  alt={post.author}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-200"
                />
                <div>
                  <p className="font-bold text-gray-900">{post.author}</p>
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(post.publishedDate).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button type="button" className="p-2 rounded-full hover:bg-gray-100 transition">
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
                <button type="button" className="p-2 rounded-full hover:bg-gray-100 transition">
                  <Bookmark className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </header>

          <div className="mb-12">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-[500px] object-cover rounded-2xl shadow-lg"
            />
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="text-gray-700 leading-relaxed space-y-6">
              <p className="text-xl first-letter:text-6xl first-letter:font-bold first-letter:text-gray-900 first-letter:mr-2 first-letter:float-left first-letter:leading-[3.5rem]">
                When it comes to making one of the biggest decisions of your life, finding the
                perfect neighborhood is just as important as finding the perfect home. Whether
                you're a first-time homebuyer or looking to relocate, understanding what makes a
                neighborhood ideal for your lifestyle and budget is crucial.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">
                Understanding Your Priorities
              </h2>
              <p>
                Before diving into specific neighborhoods, it's essential to identify what matters
                most to you. Are you looking for top-rated schools? Easy access to public
                transportation? A vibrant nightlife scene? Or perhaps a quiet, family-friendly
                atmosphere? Creating a priority list will help narrow down your search and ensure
                you find a community that aligns with your lifestyle.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">
                Location and Accessibility
              </h2>
              <p>
                The location of your home can significantly impact your daily life. Consider
                proximity to your workplace, quality of local schools, access to healthcare
                facilities, and availability of shopping and dining options. A neighborhood might
                look perfect on paper, but if it adds hours to your daily commute, the shine may
                quickly wear off.
              </p>

              <blockquote className="border-l-4 border-gray-900 pl-6 italic text-xl text-gray-600 my-8">
                "The three most important things in real estate are location, location, location.
                But what makes a location truly great is how well it fits your personal needs and
                lifestyle."
              </blockquote>

              <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Safety and Community</h2>
              <p>
                Research crime statistics and talk to current residents to get a feel for the
                neighborhood's safety. Visit at different times of the day and week to observe the
                community dynamics. A safe neighborhood with an engaged community can make all the
                difference in your quality of life.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">
                Future Development and Investment Potential
              </h2>
              <p>
                While you're focused on finding your dream home, it's also wise to consider the
                neighborhood's investment potential. Look into planned developments, infrastructure
                improvements, and economic trends in the area. A neighborhood on the rise can
                provide excellent long-term value for your investment.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">
                Amenities and Lifestyle
              </h2>
              <p>
                Think about the amenities that enhance your lifestyle. Parks and green spaces,
                fitness centers, restaurants, cultural venues, and recreational facilities all
                contribute to your daily enjoyment. Make a list of must-have amenities and evaluate
                how each neighborhood measures up.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Making Your Decision</h2>
              <p>
                Once you've narrowed down your options, spend time in each neighborhood. Walk the
                streets, visit local businesses, and imagine your daily life there. Trust your
                instincts, but also rely on data and research to make an informed decision.
                Remember, you're not just buying a house; you're investing in a community and a
                lifestyle.
              </p>

              <p className="text-lg font-semibold text-gray-900 mt-8">
                Finding the right neighborhood takes time and research, but it's well worth the
                effort. By considering these factors and doing your homework, you'll be
                well-positioned to find a community where you'll thrive for years to come.
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-start space-x-6">
                <img
                  src={post.authorAvatar}
                  alt={post.author}
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-gray-200 flex-shrink-0"
                />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">About {post.author}</h3>
                  <p className="text-gray-600 leading-relaxed">{post.authorBio}</p>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
