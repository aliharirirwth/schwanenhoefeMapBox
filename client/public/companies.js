// Hardcoded company and building data for Schwanenhöfe
export const companies = [
  {
    name: "WHU",
    logo: "image_logos/whu.jpg",
    building: "224A",
    longitude: 6.8147,
    latitude: 51.2193,
    showTriangle: true
  },
  {
    name: "TRG",
    logo: "image_logos/trg.png",
    building: "220A",
    longitude: 6.814177,
    latitude: 51.219274,
    showTriangle: true
  },
  {
    name: "Zeron",
    logo: "image_logos/zeron.png",
    building: "220A",
    longitude: 6.814177,
    latitude: 51.219274
  },
  {
    name: "Alfons",
    logo: "image_logos/alfons.jpg",
    building: "224A",
    longitude: 6.8147,
    latitude: 51.2193
  },
  {
    name: "Camp-1",
    logo: "image_logos/camp-1.jpg",
    building: "230A",
    longitude: 6.814177,
    latitude: 51.219274
  },
  {
    name: "Sopexa",
    logo: "image_logos/sopexa.png",
    building: "224A",
    longitude: 6.8147,
    latitude: 51.2193
  },
  {
    name: "Ifenius",
    logo: "image_logos/ifenius.png",
    building: "228A",
    longitude: 6.814177,
    latitude: 51.219274
  },
  {
    name: "Relyens",
    logo: "image_logos/relyens.png",
    building: "224A",
    longitude: 6.8147,
    latitude: 51.2193
  },
  {
    name: "SV Group",
    logo: "image_logos/svgroup.png",
    building: "220A",
    longitude: 6.814177,
    latitude: 51.219274
  },
  {
    name: "HM Partner",
    logo: "image_logos/hmpartner.jpg",
    building: "224A",
    longitude: 6.8147,
    latitude: 51.2193
  },
  // Add more real companies here as needed
];

// Get unique building numbers and ensure each has a triangle
const uniqueBuildings = new Set(companies.map(c => c.building));
companies.forEach(company => {
  // If this is the first company in its building, make it show the triangle
  if (!companies.some(c => c.building === company.building && c.showTriangle)) {
    company.showTriangle = true;
  }
});

// Export building numbers as an array of actual building numbers
export const buildingNumbers = Array.from(uniqueBuildings);