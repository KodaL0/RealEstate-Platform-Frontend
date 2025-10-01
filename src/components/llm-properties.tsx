/**
 * LLM Property Data Component
 * 
 * Adds Schema.org structured data to property pages for AI agents and search engines.
 * This component is invisible to users but helps AI assistants understand property data.
 */

import React from 'react';
import { Property } from '../types';

interface LLMPropertyDataProps {
  property: Property;
}

/**
 * Generates and injects Schema.org JSON-LD structured data for a property
 * 
 * @param property - Property object to generate structured data for
 * @returns Script tag with JSON-LD structured data
 */
export const LLMPropertyData: React.FC<LLMPropertyDataProps> = ({ property }) => {
  const generateStructuredData = (property: Property) => {
    // Build Schema.org RealEstateListing structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      "name": property.title,
      "description": property.description,
      "url": `https://propertpro.com/property/${property.id}`,
      
      // Offer details
      "offers": {
        "@type": "Offer",
        "price": property.price,
        "priceCurrency": "EUR",
        "availability": property.property_status === 'for_sale' 
          ? "https://schema.org/InStock" 
          : "https://schema.org/ForRent",
        "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
      },
      
      // Address information
      "address": {
        "@type": "PostalAddress",
        "addressLocality": property.city,
        "addressRegion": property.region,
        "addressCountry": "CY"
      },
      
      // Property details
      "numberOfRooms": property.bedrooms,
      "numberOfBathroomsTotal": property.bathrooms,
      
      // Floor size
      "floorSize": {
        "@type": "QuantitativeValue",
        "value": property.area,
        "unitCode": "MTK" // Square meters
      },
      
      // Year built (if available)
      ...(property.year_built && { "yearBuilt": property.year_built }),
      
      // Geo coordinates (if available)
      ...(property.latitude && property.longitude && {
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": property.latitude,
          "longitude": property.longitude
        }
      }),
      
      // Property images (if available)
      ...(property.images && property.images.length > 0 && {
        "image": property.images.map(img => 
          typeof img === 'string' ? img : img.image
        )
      }),
      
      // Amenities as features (if available)
      ...(property.amenities && property.amenities.length > 0 && {
        "amenityFeature": property.amenities.map(amenity => ({
          "@type": "LocationFeatureSpecification",
          "name": amenity
        }))
      }),
      
      // Date posted
      "datePosted": property.created_at,
      
      // Property category
      "category": property.property_type,
      
      // Additional property details
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Property Status",
          "value": property.property_status
        },
        {
          "@type": "PropertyValue",
          "name": "Property Type",
          "value": property.property_type
        }
      ]
    };

    return structuredData;
  };

  const structuredData = generateStructuredData(property);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData, null, 2) }}
    />
  );
};

export default LLMPropertyData;


