// src/pages/Favourites.tsx
import React from 'react';

const Favourites: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Your Favourites</h1>
      {/* TODO: render your saved properties here */}
      <p>You haven’t added any favourites yet.</p>
    </div>
  );
};

export default Favourites;
