/**
 * SEO Component
 *
 * Comprehensive SEO optimization component for improving organic search rankings.
 * Includes meta tags, Open Graph, Twitter Cards, and JSON-LD structured data.
 *
 * Usage:
 * <SEO
 *   title="Property Title"
 *   description="Property Description"
 *   image="https://..."
 *   url="https://..."
 *   type="property"
 * />
 */

import { Helmet } from "react-helmet-async";

interface SEOProps {
  // Basic Meta Tags
  title: string;
  description: string;
  keywords?: string;

  // Open Graph / Social Media
  image?: string;
  imageAlt?: string;
  url?: string;
  type?: "website" | "property" | "profile" | "article";

  // Property-specific data
  price?: number;
  currency?: string;
  location?: string;
  propertyType?: string;

  // Profile-specific data
  author?: string;
  profileType?: "Person" | "Organization";

  // Person schema data
  personData?: {
    name: string;
    jobTitle?: string;
    telephone?: string;
    email?: string;
    url?: string;
    address?: string;
    image?: string;
    sameAs?: string[]; // Social media profiles
    memberSince?: string;
  };

  // Organization schema data
  organizationData?: {
    name: string;
    description?: string;
    telephone?: string;
    email?: string;
    url?: string;
    address?: string;
    logo?: string;
    foundingDate?: string;
    numberOfEmployees?: string;
    aggregateRating?: {
      ratingValue: number;
      reviewCount: number;
    };
    sameAs?: string[]; // Social media profiles
  };

  // Additional meta
  publishedTime?: string;
  modifiedTime?: string;
  canonical?: string;
  noindex?: boolean;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  imageAlt,
  url,
  type = "website",
  price,
  currency = "EUR",
  location,
  propertyType,
  author,
  profileType: _profileType,
  personData,
  organizationData,
  publishedTime,
  modifiedTime,
  canonical,
  noindex = false,
  breadcrumbs,
}) => {
  // Ensure absolute URLs
  const siteUrl = "https://www.propertpro.com";
  const fullUrl = url ? (url.startsWith("http") ? url : `${siteUrl}${url}`) : siteUrl;
  const fullImage = image
    ? image.startsWith("http")
      ? image
      : `${siteUrl}${image}`
    : `${siteUrl}/og-preview.png`;
  const canonicalUrl = canonical || fullUrl;

  // Generate meta title (max 60 chars for Google)
  const metaTitle = title.length > 60 ? `${title.substring(0, 57)}...` : title;

  // Generate meta description (max 160 chars for Google)
  const metaDescription =
    description.length > 160 ? `${description.substring(0, 157)}...` : description;

  // Site name
  const siteName = "PropertPro";

  // Full page title with site name
  const fullTitle = `${metaTitle} | ${siteName}`;

  // Generate keywords
  const metaKeywords = keywords || generateKeywords({ location, propertyType, type });

  // Generate JSON-LD structured data
  const generatePersonSchema = () => {
    if (!personData) return null;

    return {
      "@context": "https://schema.org",
      "@type": "Person",
      name: personData.name,
      ...(personData.jobTitle && { jobTitle: personData.jobTitle }),
      ...(personData.telephone && { telephone: personData.telephone }),
      ...(personData.email && { email: personData.email }),
      ...(personData.url && { url: personData.url }),
      ...(personData.address && {
        address: { "@type": "PostalAddress", addressLocality: personData.address },
      }),
      ...(personData.image && { image: personData.image }),
      ...(personData.sameAs && personData.sameAs.length > 0 && { sameAs: personData.sameAs }),
      ...(personData.memberSince && {
        memberOf: {
          "@type": "Organization",
          name: "PropertPro",
          foundingDate: personData.memberSince,
        },
      }),
    };
  };

  const generateOrganizationSchema = () => {
    if (!organizationData) return null;

    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: organizationData.name,
      ...(organizationData.description && { description: organizationData.description }),
      ...(organizationData.telephone && { telephone: organizationData.telephone }),
      ...(organizationData.email && { email: organizationData.email }),
      ...(organizationData.url && { url: organizationData.url }),
      ...(organizationData.address && {
        address: { "@type": "PostalAddress", addressLocality: organizationData.address },
      }),
      ...(organizationData.logo && { logo: organizationData.logo }),
      ...(organizationData.foundingDate && { foundingDate: organizationData.foundingDate }),
      ...(organizationData.numberOfEmployees && {
        numberOfEmployees: organizationData.numberOfEmployees,
      }),
      ...(organizationData.aggregateRating && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: organizationData.aggregateRating.ratingValue,
          reviewCount: organizationData.aggregateRating.reviewCount,
        },
      }),
      ...(organizationData.sameAs &&
        organizationData.sameAs.length > 0 && { sameAs: organizationData.sameAs }),
    };
  };

  const generateBreadcrumbSchema = () => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: crumb.url.startsWith("http") ? crumb.url : `${siteUrl}${crumb.url}`,
      })),
    };
  };

  const personSchema = generatePersonSchema();
  const organizationSchema = generateOrganizationSchema();
  const breadcrumbSchema = generateBreadcrumbSchema();

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {metaKeywords && <meta name="keywords" content={metaKeywords} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && (
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
      )}

      {/* Open Graph (Facebook, LinkedIn) */}
      <meta property="og:type" content={type === "property" ? "product" : type} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:secure_url" content={fullImage} />
      <meta property="og:image:alt" content={imageAlt || metaTitle} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_US" />

      {/* Property-specific Open Graph */}
      {price && (
        <>
          <meta property="product:price:amount" content={price.toString()} />
          <meta property="product:price:currency" content={currency} />
        </>
      )}

      {/* Article meta (for blogs/profiles) */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:image:alt" content={imageAlt || metaTitle} />
      <meta name="twitter:site" content="@PropertPro" />
      <meta name="twitter:creator" content="@PropertPro" />

      {/* Additional SEO Meta Tags */}
      <meta name="author" content={author || siteName} />
      <meta name="language" content="English" />
      <meta name="geo.region" content="CY" />
      <meta name="geo.placename" content={location || "Cyprus"} />

      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta name="theme-color" content="#2563eb" />

      {/* Apple */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={siteName} />

      {/* Microsoft */}
      <meta name="msapplication-TileColor" content="#2563eb" />
      <meta name="msapplication-TileImage" content="/favicon-96x96.png" />

      {/* JSON-LD Structured Data */}
      {personSchema && <script type="application/ld+json">{JSON.stringify(personSchema)}</script>}
      {organizationSchema && (
        <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      )}
      {breadcrumbSchema && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      )}
    </Helmet>
  );
};

/**
 * Generate relevant keywords based on content
 */
const generateKeywords = ({
  location,
  propertyType,
  type,
}: {
  location?: string;
  propertyType?: string;
  type?: string;
}): string => {
  const baseKeywords = [
    "Cyprus real estate",
    "Cyprus property",
    "property Cyprus",
    "real estate Cyprus",
    "PropertPro",
  ];

  if (location) {
    baseKeywords.push(
      `${location} property`,
      `${location} real estate`,
      `property for sale ${location}`,
      `property for rent ${location}`,
    );
  }

  if (propertyType) {
    baseKeywords.push(
      `${propertyType} Cyprus`,
      `${propertyType} for sale`,
      `${propertyType} for rent`,
    );
  }

  if (type === "profile") {
    baseKeywords.push("real estate agent Cyprus", "property agent Cyprus", "Cyprus realtor");
  }

  return baseKeywords.join(", ");
};

export default SEO;
