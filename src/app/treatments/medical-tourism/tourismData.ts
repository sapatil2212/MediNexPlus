export interface StateDetail {
  id: string;
  name: string;
  image: string;
  tagline: string;
  vibe: string[];
  experience: string;
  duration: string;
  startingPrice: string;
  highlights: string[];
  includes: string[];
  medicalServices: string[];
  patientJourney: string[];
}

export interface Zone {
  id: string;
  name: string;
  icon: string; // Key for Lucide icon
  image: string;
  shortDescription: string;
  highlights: string[];
  coverage: string[];
  startingPackage: string;
  vibeTags: string[];
  states: StateDetail[];
}

export const medicalTourismData: Zone[] = [
  {
    id: "north",
    name: "North India: The Imperial & Royal Circuit",
    icon: "Mountain",
    image: "/images/medical-tourism/north-india.png",
    shortDescription: "Discover India’s grand heritage, iconic landmarks, and peaceful Himalayan retreats.",
    highlights: [
      "Visit the Taj Mahal",
      "Explore royal palaces and forts",
      "Relax in mountain wellness retreats"
    ],
    coverage: ["Delhi", "Rajasthan", "Punjab", "Himachal Pradesh", "Uttarakhand", "Uttar Pradesh"],
    startingPackage: "₹4,45,000 + Treatment",
    vibeTags: ["Grandeur", "History", "Serenity"],
    states: [
      {
        id: "delhi",
        name: "Delhi",
        image: "/images/medical-tourism/delhi_tourism_1776836076971.png",
        tagline: "The Heart of India",
        vibe: ["Metropolitan", "Historic", "Dynamic"],
        experience: "Experience a blend of ancient history and modern luxury in the capital city.",
        duration: "7 Days / 6 Nights",
        startingPrice: "₹1,25,000",
        highlights: ["Red Fort", "Qutub Minar", "Luxury Shopping"],
        includes: ["5-Star Stay", "Private Transfers", "Translator", "Medical Assistance", "Insurance"],
        medicalServices: ["Multi-speciality hospital access", "Pre-treatment consultation", "Surgery & procedures"],
        patientJourney: ["Arrival & pickup", "Hospital consultation", "Treatment", "Recovery & tourism", "Safe return"]
      },
      {
        id: "rajasthan",
        name: "Rajasthan",
        image: "/images/medical-tourism/rajasthan_tourism_1776836092109.png",
        tagline: "The Land of Kings",
        vibe: ["Royal", "Vibrant", "Majestic"],
        experience: "Heal amidst the grandeur of palaces and the tranquility of desert landscapes.",
        duration: "10 Days / 9 Nights",
        startingPrice: "₹1,85,000",
        highlights: ["City Palace Jaipur", "Udaipur Lakes", "Desert Safari"],
        includes: ["Heritage Stay", "Private Transfers", "Translator", "Medical Assistance", "Insurance"],
        medicalServices: ["Top-tier aesthetic clinics", "Holistic wellness centers", "Post-op recovery"],
        patientJourney: ["Arrival & pickup", "Hospital consultation", "Treatment", "Recovery in Palace", "Safe return"]
      }
    ]
  },
  {
    id: "south",
    name: "South India: The Tropical & Heritage Circuit",
    icon: "Palmtree",
    image: "/images/medical-tourism/south-india.jpeg",
    shortDescription: "Experience lush landscapes, ancient temples, and world-class healthcare hubs.",
    highlights: [
      "Cruise Kerala backwaters",
      "Visit historic temples",
      "Access top-tier hospitals"
    ],
    coverage: ["Kerala", "Karnataka", "Tamil Nadu", "Andhra Pradesh", "Telangana"],
    startingPackage: "₹3,60,000 + Treatment",
    vibeTags: ["Lush", "Spiritual", "Coastal"],
    states: [
      {
        id: "kerala",
        name: "Kerala",
        image: "/images/medical-tourism/kerala_tourism_1776836106973.png",
        tagline: "God's Own Country",
        vibe: ["Tropical", "Ayurvedic", "Serene"],
        experience: "Rejuvenate with traditional Ayurveda and modern medicine in tropical bliss.",
        duration: "12 Days / 11 Nights",
        startingPrice: "₹1,45,000",
        highlights: ["Backwater Houseboats", "Munnar Tea Gardens", "Ayurveda Centers"],
        includes: ["Resort Stay", "Private Transfers", "Translator", "Medical Assistance", "Insurance"],
        medicalServices: ["Advanced surgical care", "Ayurvedic integration", "Rehabilitation"],
        patientJourney: ["Arrival & pickup", "Treatment", "Backwater recovery", "Final checkup", "Safe return"]
      }
    ]
  },
  {
    id: "west",
    name: "West India: The Coastal & Glamour Circuit",
    icon: "Waves",
    image: "/images/medical-tourism/west-india.jpg",
    shortDescription: "A vibrant mix of beaches, modern cities, and cultural experiences.",
    highlights: [
      "Relax in Goa beaches",
      "Experience Mumbai lifestyle",
      "Explore the Rann of Kutch"
    ],
    coverage: ["Goa", "Maharashtra", "Gujarat"],
    startingPackage: "₹2,95,000 + Treatment",
    vibeTags: ["Chic", "Vibrant", "Diverse"],
    states: [
      {
        id: "goa",
        name: "Goa",
        image: "/images/medical-tourism/goa_tourism_1776836133822.png",
        tagline: "Beaches & Bliss",
        vibe: ["Coastal", "Relaxed", "Vibrant"],
        experience: "Combine top-tier dental and aesthetic treatments with a beachside recovery.",
        duration: "8 Days / 7 Nights",
        startingPrice: "₹95,000",
        highlights: ["North Goa Beaches", "Old Goa Churches", "Water Sports"],
        includes: ["Beach Resort Stay", "Private Transfers", "Translator", "Medical Assistance", "Insurance"],
        medicalServices: ["Dental Implants", "Cosmetic Surgery", "Wellness Spa"],
        patientJourney: ["Arrival & pickup", "Procedure", "Beach recovery", "Follow-up", "Safe return"]
      }
    ]
  },
  {
    id: "east",
    name: "East & Central India: The Cultural & Wild Heartland",
    icon: "Trees",
    image: "/images/medical-tourism/east-india.jpg",
    shortDescription: "Immerse yourself in culture, spirituality, and wildlife adventures.",
    highlights: [
      "Tiger safaris",
      "Ancient temples",
      "Colonial heritage"
    ],
    coverage: ["West Bengal", "Odisha", "Madhya Pradesh", "Bihar", "Chhattisgarh", "Jharkhand"],
    startingPackage: "₹3,15,000 + Treatment",
    vibeTags: ["Artistic", "Raw", "Untamed"],
    states: [
      {
        id: "west-bengal",
        name: "West Bengal",
        image: "/images/medical-tourism/west_bengal_tourism_1776836148394.png",
        tagline: "The Cultural Capital",
        vibe: ["Artistic", "Colonial", "Spiritual"],
        experience: "Explore the legacy of the British Raj while receiving expert medical care.",
        duration: "9 Days / 8 Nights",
        startingPrice: "₹1,10,000",
        highlights: ["Victoria Memorial", "Darjeeling Hills", "Sunderbans"],
        includes: ["Luxury Stay", "Private Transfers", "Translator", "Medical Assistance", "Insurance"],
        medicalServices: ["Specialized oncology", "Cardiology", "General surgery"],
        patientJourney: ["Arrival", "Consultation", "Treatment", "Cultural tour", "Return"]
      }
    ]
  },
  {
    id: "northeast",
    name: "North East India: The Seven Sisters & Sikkim Circuit",
    icon: "Compass",
    image: "/images/medical-tourism/north-east.png",
    shortDescription: "Explore untouched nature, spiritual retreats, and scenic mountain escapes.",
    highlights: [
      "Monasteries & meditation",
      "Living root bridges",
      "Tea estates & valleys"
    ],
    coverage: ["Sikkim", "Assam", "Meghalaya", "Arunachal Pradesh", "Nagaland", "Manipur", "Mizoram", "Tripura"],
    startingPackage: "₹3,85,000 + Treatment",
    vibeTags: ["Zen", "Mystical", "Exotic"],
    states: [
      {
        id: "sikkim",
        name: "Sikkim",
        image: "/images/medical-tourism/sikkim_tourism_1776836164044.png",
        tagline: "The Himalayan Paradise",
        vibe: ["Zen", "Mystical", "Pristine"],
        experience: "Heal in the lap of the Himalayas with mountain air and spiritual energy.",
        duration: "14 Days / 13 Nights",
        startingPrice: "₹1,95,000",
        highlights: ["Gangtok Monasteries", "Tsomgo Lake", "Organic Farms"],
        includes: ["Boutique Stay", "Mountain Transfers", "Translator", "Medical Assistance", "Insurance"],
        medicalServices: ["Wellness & Meditation", "Holistic Healing", "Recovery Retreats"],
        patientJourney: ["Arrival", "Wellness retreat", "Minor treatments", "Meditation", "Return"]
      }
    ]
  }
];
