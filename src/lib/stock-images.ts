// Stock images for physics lessons
// Using various nature and science-themed images that work well for educational content

export const stockImages = [
  // Nature and landscape images
  'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=300&fit=crop', // Night sky with stars
  'https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?w=400&h=300&fit=crop', // Laboratory equipment
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop', // Lightbulb concept
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop', // Abstract waves
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop', // Ocean waves
  'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=300&fit=crop', // Physics equations on board
  'https://images.unsplash.com/photo-1453733190371-0a9bedd82893?w=400&h=300&fit=crop', // Light trails
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop', // Circuit board
  'https://images.unsplash.com/photo-1564325724739-bae0bd08762c?w=400&h=300&fit=crop', // Scientific glassware
  'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=300&fit=crop', // Northern lights
  'https://images.unsplash.com/photo-1628126235206-5260b9ea6441?w=400&h=300&fit=crop', // Abstract science
  'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=400&h=300&fit=crop', // Light prism
  'https://images.unsplash.com/photo-1474314243412-cd4a79f02c6a?w=400&h=300&fit=crop', // Pendulum
  'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=400&h=300&fit=crop', // Electric sparks
  'https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?w=400&h=300&fit=crop', // Math notebook
  'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=300&fit=crop', // Robot/AI
];

// Function to get a deterministic stock image based on lesson ID
export function getStockImage(lessonId: string | number): string {
  // Convert lesson ID to a number for consistent indexing
  let hash = 0;
  const idString = String(lessonId);
  
  for (let i = 0; i < idString.length; i++) {
    const char = idString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get a consistent index
  const index = Math.abs(hash) % stockImages.length;
  return stockImages[index];
}

// Function to get a random stock image (for cases where ID is not available)
export function getRandomStockImage(): string {
  const index = Math.floor(Math.random() * stockImages.length);
  return stockImages[index];
}