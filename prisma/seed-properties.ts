// Demo listings for `npm run seed`. Photos are free-license Unsplash images,
// hot-linked from images.unsplash.com (allowed in the frontend's next.config).
// The first photo is the cover. Prices are monthly rent in BDT.

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;

// Landlord accounts the listings are spread across ("demo" is the demo landlord).
export const SEED_LANDLORDS = [
  { key: "rahima", name: "Rahima Khatun", email: "rahima.landlord@example.com" },
  { key: "tanvir", name: "Tanvir Ahmed", email: "tanvir.landlord@example.com" },
  { key: "nusrat", name: "Nusrat Jahan", email: "nusrat.landlord@example.com" },
] as const;

export const SEED_CATEGORIES = ["Apartment", "Duplex", "Studio", "Family House", "Penthouse", "Villa"] as const;

type SeedProperty = {
  landlord: "demo" | (typeof SEED_LANDLORDS)[number]["key"];
  category: (typeof SEED_CATEGORIES)[number];
  title: string;
  description: string;
  address: string;
  city: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
};

export const SEED_PROPERTIES: SeedProperty[] = [
  // ── Dhaka ──────────────────────────────────────────────────────────────
  {
    landlord: "demo",
    category: "Apartment",
    title: "Sunlit 3-Bed Apartment in Dhanmondi",
    description:
      "South-facing 1,650 sq ft apartment on the 6th floor, two minutes from Dhanmondi Lake. Three bedrooms with attached baths, a wide drawing-dining space and two balconies that catch the evening breeze. Suits a family; two months' advance, utilities billed separately.",
    address: "House 27, Road 9A, Dhanmondi",
    city: "Dhaka",
    price: 65000,
    bedrooms: 3,
    bathrooms: 3,
    amenities: ["Lift", "Generator backup", "Gas line", "Car parking", "24/7 security", "Rooftop access"],
    images: [
      photo("1460317442991-0ec209397118"),
      photo("1502672260266-1c1ef2d93688"),
      photo("1505693416388-ac5ce068fe85"),
      photo("1484154218962-a197022b5858"),
      photo("1552321554-5fefe8c9ef14"),
    ],
  },
  {
    landlord: "rahima",
    category: "Penthouse",
    title: "Lake-View Penthouse in Gulshan 2",
    description:
      "Top-floor penthouse with a private roof terrace overlooking Gulshan Lake. Four en-suite bedrooms, an open-plan living area with floor-to-ceiling glass, and a chef's kitchen. Building has a pool, gym and round-the-clock concierge.",
    address: "Road 104, Gulshan 2",
    city: "Dhaka",
    price: 280000,
    bedrooms: 4,
    bathrooms: 4,
    amenities: ["Lift", "Generator backup", "Swimming pool", "Gym", "Rooftop terrace", "Central AC", "24/7 security"],
    images: [
      photo("1551361415-69c87624334f"),
      photo("1600607687939-ce8a6c25118c"),
      photo("1616594039964-ae9021a400a0"),
      photo("1600566752229-250ed79470f8"),
      photo("1600566752355-35792bedcfea"),
    ],
  },
  {
    landlord: "demo",
    category: "Studio",
    title: "Furnished Studio near Banani 11",
    description:
      "Compact, fully furnished studio a short walk from Banani Road 11's cafés and offices. Comes with a queen bed, work desk, split AC and a fitted kitchenette. Ideal for a young professional; Wi-Fi and service charge included.",
    address: "Road 11, Block H, Banani",
    city: "Dhaka",
    price: 32000,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ["Furnished", "Wi-Fi", "Air conditioning", "Lift", "Generator backup"],
    images: [
      photo("1586023492125-27b2c045efd7"),
      photo("1595526114035-0d45ed16cfbf"),
      photo("1600607686527-6fb886090705"),
    ],
  },
  {
    landlord: "tanvir",
    category: "Apartment",
    title: "Family Flat in Mirpur DOHS",
    description:
      "Quiet, well-kept 3-bedroom flat inside Mirpur DOHS, close to schools, the central mosque and the DOHS market. Tiled floors, plenty of natural light and a covered car park. Families only.",
    address: "Avenue 3, Mirpur DOHS",
    city: "Dhaka",
    price: 38000,
    bedrooms: 3,
    bathrooms: 2,
    amenities: ["Lift", "Gas line", "Car parking", "CCTV", "Near school"],
    images: [
      photo("1545324418-cc1a3fa10c00"),
      photo("1560185127-6ed189bf02f4"),
      photo("1560185893-a55cbc8c57e8"),
      photo("1556912173-3bb406ef7e77"),
      photo("1584622650111-993a426fbf0a"),
    ],
  },
  {
    landlord: "rahima",
    category: "Duplex",
    title: "Modern Duplex in Bashundhara R/A",
    description:
      "Architect-designed duplex with a private front garden in Block D. Five bedrooms across two floors, a double-height living room, servant's quarter and parking for two cars. Close to North South University and Bashundhara City.",
    address: "Road 5, Block D, Bashundhara R/A",
    city: "Dhaka",
    price: 150000,
    bedrooms: 5,
    bathrooms: 5,
    amenities: ["Private garden", "Car parking", "Servant quarter", "Generator backup", "CCTV", "Intercom"],
    images: [
      photo("1600047509358-9dc75507daeb"),
      photo("1600047508788-786f3865b4b9"),
      photo("1617098900591-3f90928e8c54"),
      photo("1600585152220-90363fe7e115"),
      photo("1620626011761-996317b8d101"),
    ],
  },
  {
    landlord: "nusrat",
    category: "Apartment",
    title: "Budget 2-Bed Flat in Mohammadpur",
    description:
      "Affordable 2-bedroom flat off Iqbal Road with a south balcony and a dedicated gas line. Walking distance to Town Hall market and bus routes. Small family or working couple preferred.",
    address: "Iqbal Road, Mohammadpur",
    city: "Dhaka",
    price: 22000,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["Gas line", "Water reservoir", "Balcony", "Near bus stop"],
    images: [
      photo("1574362848149-11496d93a7c7"),
      photo("1513694203232-719a280e022f"),
      photo("1522771739844-6a9f6d5f14af"),
      photo("1556911220-bff31c812dba"),
    ],
  },
  {
    landlord: "tanvir",
    category: "Apartment",
    title: "Uttara Sector 7 Apartment with Balcony Garden",
    description:
      "Bright 3-bedroom apartment with a planted balcony looking onto Sector 7 park. Ten minutes to the airport and the metro. Lift, generator and reserved parking included.",
    address: "Road 18, Sector 7, Uttara",
    city: "Dhaka",
    price: 42000,
    bedrooms: 3,
    bathrooms: 3,
    amenities: ["Lift", "Generator backup", "Gas line", "Car parking", "Balcony"],
    images: [
      photo("1580041065738-e72023775cdc"),
      photo("1560448204-e02f11c3d0e2"),
      photo("1540518614846-7eded433c457"),
      photo("1560440021-33f9b867899d"),
      photo("1595514535415-dae8580c416c"),
    ],
  },
  {
    landlord: "rahima",
    category: "Apartment",
    title: "Executive Serviced Apartment in Baridhara",
    description:
      "Fully serviced 2-bedroom apartment in the diplomatic zone, with weekly housekeeping, a resort-style pool and a 24-hour front desk. Furnished to hotel standard; utilities and Wi-Fi included in the rent.",
    address: "Park Road, Baridhara",
    city: "Dhaka",
    price: 160000,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["Furnished", "Housekeeping", "Swimming pool", "Gym", "Wi-Fi", "24/7 security"],
    images: [
      photo("1594484208280-efa00f96fc21"),
      photo("1598928506311-c55ded91a20c"),
      photo("1631049307264-da0ec9d70304"),
      photo("1588854337236-6889d631faa8"),
      photo("1617806118233-18e1de247200"),
    ],
  },
  {
    landlord: "demo",
    category: "Villa",
    title: "Lakeside Villa in Purbachal",
    description:
      "Contemporary villa with its own swimming pool on a quiet lakeside plot in Purbachal New Town. Four bedrooms, a glass-walled living room that opens onto the deck, and a landscaped garden. Twenty minutes from the airport via the 300 ft road.",
    address: "Sector 4, Purbachal New Town",
    city: "Dhaka",
    price: 120000,
    bedrooms: 4,
    bathrooms: 4,
    amenities: ["Swimming pool", "Garden", "Car parking", "Generator backup", "Lake view"],
    images: [
      photo("1600596542815-ffad4c1539a9"),
      photo("1600585154084-4e5fe7c39198"),
      photo("1617104678098-de229db51175"),
      photo("1507089947368-19c1da9775ae"),
      photo("1600607687920-4e2a09cf159d"),
    ],
  },
  {
    landlord: "nusrat",
    category: "Apartment",
    title: "Cozy 2-Bed Apartment in Shyamoli",
    description:
      "Warm, plant-filled 2-bedroom apartment on a calm lane near Shyamoli Square. Freshly painted, with a reading nook and a fitted kitchen. Five minutes to Ring Road buses.",
    address: "Ring Road, Shyamoli",
    city: "Dhaka",
    price: 25000,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["Gas line", "Balcony", "Water reservoir", "Near bus stop"],
    images: [
      photo("1502672023488-70e25813eb80"),
      photo("1522708323590-d24dbb6b0267"),
      photo("1556020685-ae41abfc9365"),
      photo("1565538810643-b5bdb714032a"),
      photo("1552321554-5fefe8c9ef14"),
    ],
  },
  {
    landlord: "tanvir",
    category: "Duplex",
    title: "Duplex Townhouse in Banani DOHS",
    description:
      "Two-storey townhouse with a private gate and a front yard inside secure Banani DOHS. Four bedrooms, a family lounge upstairs and a large modern kitchen. Pets welcome.",
    address: "Road 6, Banani DOHS",
    city: "Dhaka",
    price: 135000,
    bedrooms: 4,
    bathrooms: 4,
    amenities: ["Car parking", "Private garden", "Generator backup", "CCTV", "Pet friendly"],
    images: [
      photo("1600563438938-a9a27216b4f5"),
      photo("1600566753086-00f18fb6b3ea"),
      photo("1615874959474-d609969a20ed"),
      photo("1600489000022-c2086d79f9d4"),
      photo("1584622650111-993a426fbf0a"),
    ],
  },
  {
    landlord: "nusrat",
    category: "Studio",
    title: "Bachelor-Friendly Studio in Mohakhali DOHS",
    description:
      "Neat studio with a separate kitchenette, ideal for a working bachelor. Steps from Mohakhali bus terminal and the flyover. Electricity sub-metered; one month's advance.",
    address: "Road 26, Mohakhali DOHS",
    city: "Dhaka",
    price: 18000,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ["Lift", "Wi-Fi", "Bachelor friendly", "Generator backup"],
    images: [
      photo("1583847268964-b28dc8f51f92"),
      photo("1600607687644-c7171b42498f"),
      photo("1484154218962-a197022b5858"),
    ],
  },

  // ── Chattogram ─────────────────────────────────────────────────────────
  {
    landlord: "rahima",
    category: "Apartment",
    title: "Hill-View Apartment in Khulshi",
    description:
      "Spacious 3-bedroom apartment on the slopes of Khulshi with green hill views from every room. Double-height living room, covered parking and a standby generator. Close to Foy's Lake and the medical college.",
    address: "Road 2, South Khulshi",
    city: "Chattogram",
    price: 55000,
    bedrooms: 3,
    bathrooms: 3,
    amenities: ["Lift", "Generator backup", "Car parking", "Hill view", "Gas line"],
    images: [
      photo("1515263487990-61b07816b324"),
      photo("1564078516393-cf04bd966897"),
      photo("1611892440504-42a792e24d32"),
      photo("1600566752229-250ed79470f8"),
      photo("1595514535415-dae8580c416c"),
    ],
  },
  {
    landlord: "tanvir",
    category: "Studio",
    title: "Loft Studio in Agrabad Business District",
    description:
      "Industrial-style loft studio with exposed brick, five minutes from Agrabad's banks and port offices. Open kitchen, high ceilings and a mezzanine sleeping area. Furnished.",
    address: "Sheikh Mujib Road, Agrabad",
    city: "Chattogram",
    price: 20000,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ["Furnished", "Air conditioning", "Lift", "Wi-Fi"],
    images: [
      photo("1505873242700-f289a29e1e0f"),
      photo("1617325247661-675ab4b64ae2"),
      photo("1560440021-33f9b867899d"),
    ],
  },
  {
    landlord: "demo",
    category: "Family House",
    title: "Family House with Garden in Nasirabad",
    description:
      "Detached four-bedroom house with a front lawn in a quiet part of Nasirabad Housing Society. Separate dining room, a big kitchen and a garage. Near reputed schools and the GEC circle.",
    address: "Road 3, Nasirabad Housing Society",
    city: "Chattogram",
    price: 70000,
    bedrooms: 4,
    bathrooms: 3,
    amenities: ["Garden", "Garage", "Gas line", "Near school", "Servant quarter"],
    images: [
      photo("1576941089067-2de3c901e126"),
      photo("1560185007-cde436f6a4d0"),
      photo("1540518614846-7eded433c457"),
      photo("1556912173-3bb406ef7e77"),
      photo("1584622650111-993a426fbf0a"),
    ],
  },
  {
    landlord: "nusrat",
    category: "Duplex",
    title: "Sea-Breeze Duplex near Patenga",
    description:
      "Modern duplex a short drive from Patenga beach and the airport. Five bedrooms, a rooftop sit-out and wide windows that let in the sea breeze. Ideal for a large family or company lease.",
    address: "Airport Road, South Patenga",
    city: "Chattogram",
    price: 95000,
    bedrooms: 5,
    bathrooms: 4,
    amenities: ["Rooftop terrace", "Car parking", "Generator backup", "CCTV", "Near airport"],
    images: [
      photo("1600566753190-17f0baa2a6c3"),
      photo("1600210492493-0946911123ea"),
      photo("1617098900591-3f90928e8c54"),
      photo("1600607686527-6fb886090705"),
      photo("1620626011761-996317b8d101"),
    ],
  },

  // ── Sylhet ─────────────────────────────────────────────────────────────
  {
    landlord: "rahima",
    category: "Villa",
    title: "Tea-Garden View Villa in Sylhet",
    description:
      "Peaceful villa beside the tea gardens off Airport Road, with a large lawn and a wraparound veranda. Four bedrooms, a fireplace lounge and a fully equipped kitchen. Fifteen minutes to Zindabazar.",
    address: "Airport Road, Malnicherra",
    city: "Sylhet",
    price: 85000,
    bedrooms: 4,
    bathrooms: 4,
    amenities: ["Garden", "Car parking", "Generator backup", "Tea garden view", "Fireplace"],
    images: [
      photo("1600607688969-a5bfcd646154"),
      photo("1600210492486-724fe5c67fb0"),
      photo("1617104678098-de229db51175"),
      photo("1600585152220-90363fe7e115"),
      photo("1600566752355-35792bedcfea"),
    ],
  },
  {
    landlord: "tanvir",
    category: "Apartment",
    title: "Central 2-Bed Apartment in Zindabazar",
    description:
      "Well-located 2-bedroom flat in the heart of Sylhet city, walking distance to Zindabazar's shops and restaurants. Lift, generator and a secure entrance.",
    address: "Jallarpar Road, Zindabazar",
    city: "Sylhet",
    price: 18000,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["Lift", "Generator backup", "Gas line", "24/7 security"],
    images: [
      photo("1501183638710-841dd1904471"),
      photo("1554995207-c18c203602cb"),
      photo("1595526114035-0d45ed16cfbf"),
      photo("1565538810643-b5bdb714032a"),
    ],
  },
  {
    landlord: "demo",
    category: "Family House",
    title: "Townhouse for Families in Uposhohor",
    description:
      "Three-bedroom townhouse in a gated row in Shahjalal Uposhohor, with its own garage and a small backyard. Quiet neighbourhood with a playground and mosque nearby.",
    address: "Block C, Shahjalal Uposhohor",
    city: "Sylhet",
    price: 26000,
    bedrooms: 3,
    bathrooms: 2,
    amenities: ["Garage", "Gas line", "Playground nearby", "Gated community"],
    images: [
      photo("1567496898669-ee935f5f647a"),
      photo("1493809842364-78817add7ffb"),
      photo("1560185893-a55cbc8c57e8"),
      photo("1556911220-bff31c812dba"),
      photo("1552321554-5fefe8c9ef14"),
    ],
  },

  // ── Rajshahi ───────────────────────────────────────────────────────────
  {
    landlord: "nusrat",
    category: "Apartment",
    title: "Padma Riverside Apartment",
    description:
      "Airy 3-bedroom apartment a block from the Padma river promenade. Big windows, a breezy balcony and a modern kitchen. Close to Rajshahi Medical College.",
    address: "Padma Residential Area, Boalia",
    city: "Rajshahi",
    price: 20000,
    bedrooms: 3,
    bathrooms: 2,
    amenities: ["Lift", "Balcony", "Gas line", "River view"],
    images: [
      photo("1505691938895-1758d7feb511"),
      photo("1567767292278-a4f21aa2d36e"),
      photo("1505693416388-ac5ce068fe85"),
      photo("1484154218962-a197022b5858"),
      photo("1595514535415-dae8580c416c"),
    ],
  },
  {
    landlord: "tanvir",
    category: "Studio",
    title: "Student Studio near Rajshahi University",
    description:
      "Simple, clean studio for a student, five minutes' walk from the Rajshahi University gate. Furnished with a bed, study table and wardrobe; Wi-Fi included.",
    address: "Binodpur Bazar, Motihar",
    city: "Rajshahi",
    price: 9000,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ["Furnished", "Wi-Fi", "Bachelor friendly", "Near university"],
    images: [
      photo("1631679706909-1844bbd07221"),
      photo("1631049307264-da0ec9d70304"),
      photo("1560440021-33f9b867899d"),
    ],
  },

  // ── Khulna ─────────────────────────────────────────────────────────────
  {
    landlord: "rahima",
    category: "Family House",
    title: "Sonadanga Family House",
    description:
      "Comfortable four-bedroom house with a front yard in Sonadanga residential area. Separate drawing and dining, a large kitchen and a rooftop. Near Khulna's main bus terminal and schools.",
    address: "Road 4, Sonadanga R/A",
    city: "Khulna",
    price: 30000,
    bedrooms: 4,
    bathrooms: 3,
    amenities: ["Garden", "Car parking", "Gas line", "Rooftop access", "Near school"],
    images: [
      photo("1570129477492-45c003edd2be"),
      photo("1600210491892-03d54c0aaf87"),
      photo("1611892440504-42a792e24d32"),
      photo("1600489000022-c2086d79f9d4"),
      photo("1584622650111-993a426fbf0a"),
    ],
  },

  // ── Cox's Bazar ────────────────────────────────────────────────────────
  {
    landlord: "demo",
    category: "Apartment",
    title: "Ocean-View Apartment in Kolatoli",
    description:
      "Furnished 2-bedroom apartment a short walk from Kolatoli beach, with sea views from the living room. Ideal for a long stay or remote work by the sea.",
    address: "Kolatoli Road",
    city: "Cox's Bazar",
    price: 45000,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["Furnished", "Sea view", "Wi-Fi", "Lift", "Generator backup"],
    images: [
      photo("1615529182904-14819c35db37"),
      photo("1616046229478-9901c5536a45"),
      photo("1600607687644-c7171b42498f"),
      photo("1600566752229-250ed79470f8"),
      photo("1620626011761-996317b8d101"),
    ],
  },
  {
    landlord: "nusrat",
    category: "Villa",
    title: "Beachside Villa with Pool in Inani",
    description:
      "Private villa on the Marine Drive near Inani beach, with an infinity pool and a shaded terrace. Four bedrooms, a big open living area and a caretaker on site.",
    address: "Marine Drive, Inani",
    city: "Cox's Bazar",
    price: 110000,
    bedrooms: 4,
    bathrooms: 4,
    amenities: ["Swimming pool", "Sea view", "Caretaker", "Car parking", "Generator backup"],
    images: [
      photo("1613490493576-7fde63acd811"),
      photo("1615874694520-474822394e73"),
      photo("1617098900591-3f90928e8c54"),
      photo("1507089947368-19c1da9775ae"),
      photo("1600566752355-35792bedcfea"),
    ],
  },

  // ── Gazipur ────────────────────────────────────────────────────────────
  {
    landlord: "tanvir",
    category: "Duplex",
    title: "Garden Duplex near Gazipur Chowrasta",
    description:
      "Four-bedroom duplex with a lawn and a covered car porch, ten minutes from Gazipur Chowrasta. Popular with factory managers; company leases accepted.",
    address: "Joydebpur Road, Gazipur Sadar",
    city: "Gazipur",
    price: 55000,
    bedrooms: 4,
    bathrooms: 3,
    amenities: ["Garden", "Car parking", "Generator backup", "Gas line"],
    images: [
      photo("1600585153490-76fb20a32601"),
      photo("1615873968403-89e068629265"),
      photo("1615874959474-d609969a20ed"),
      photo("1600585152220-90363fe7e115"),
      photo("1552321554-5fefe8c9ef14"),
    ],
  },

  // ── Barishal ───────────────────────────────────────────────────────────
  {
    landlord: "rahima",
    category: "Apartment",
    title: "Riverside Flat in Barishal",
    description:
      "Two-bedroom flat near the Kirtankhola riverbank with a bright, open living room. Walking distance to the launch terminal and Sadar Road.",
    address: "Sadar Road, Barishal",
    city: "Barishal",
    price: 16000,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["Balcony", "Gas line", "River view", "Water reservoir"],
    images: [
      photo("1536376072261-38c75010e6c9"),
      photo("1565183997392-2f6f122e5912"),
      photo("1556020685-ae41abfc9365"),
      photo("1556911220-bff31c812dba"),
    ],
  },
];
