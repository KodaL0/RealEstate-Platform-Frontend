/**
 * LLM Profile Data Component
 * 
 * Adds Schema.org structured data to user profile pages for AI agents and search engines.
 * This component is invisible to users but helps AI assistants understand profile data.
 */

import React from 'react';

interface ProfileUser {
  id: number;
  username: string;
  name?: string;
  bio?: string;
  location?: string;
  website?: string;
  is_developer?: boolean;
  date_joined?: string;
  avatar?: string;
}

interface LLMProfileDataProps {
  user: ProfileUser;
  propertiesCount?: number;
}

/**
 * Generates and injects Schema.org JSON-LD structured data for a user profile
 * 
 * @param user - User profile object to generate structured data for
 * @param propertiesCount - Number of properties the user has listed
 * @returns Script tag with JSON-LD structured data
 */
export const LLMProfileData: React.FC<LLMProfileDataProps> = ({ user, propertiesCount }) => {
  const generateStructuredData = (user: ProfileUser, propertiesCount?: number) => {
    // Build Schema.org Person/RealEstateAgent structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": user.is_developer ? "RealEstateAgent" : "Person",
      "name": user.name || user.username,
      "url": `https://propertpro.com/${user.username}`,
      
      // Description from bio
      ...(user.bio && { "description": user.bio }),
      
      // Location
      ...(user.location && {
        "address": {
          "@type": "PostalAddress",
          "addressLocality": user.location,
          "addressCountry": "CY"
        }
      }),
      
      // Website
      ...(user.website && { "url": user.website }),
      
      // Avatar image
      ...(user.avatar && { "image": user.avatar }),
      
      // Additional properties for RealEstateAgent
      ...(user.is_developer && {
        "knowsAbout": "Real Estate",
        "serviceArea": {
          "@type": "Place",
          "name": "Cyprus"
        }
      }),
      
      // Number of listings (as additional property)
      ...(propertiesCount !== undefined && propertiesCount > 0 && {
        "numberOfItems": propertiesCount,
        "additionalProperty": {
          "@type": "PropertyValue",
          "name": "Active Listings",
          "value": propertiesCount
        }
      }),
      
      // Profile identifier
      "identifier": user.username,
      
      // Join date
      ...(user.date_joined && { "dateCreated": user.date_joined })
    };

    return structuredData;
  };

  const structuredData = generateStructuredData(user, propertiesCount);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData, null, 2) }}
    />
  );
};

export default LLMProfileData;




