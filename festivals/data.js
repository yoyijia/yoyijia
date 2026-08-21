export const YEARS = [2025, 2026, 2027];

export const COUNTRIES = [
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "GLOBAL", name: "Global / online", flag: "🌍" },
];

export const PRESETS = [
  { id: "sg", label: "Singapore", countries: ["SG"] },
  {
    id: "sea",
    label: "Southeast Asia",
    countries: ["SG", "MY", "ID", "TH", "VN", "PH"],
  },
  {
    id: "greater-china",
    label: "Greater China",
    countries: ["CN", "HK", "TW", "SG"],
  },
  {
    id: "east-asia",
    label: "East Asia",
    countries: ["CN", "HK", "TW", "JP", "KR"],
  },
  {
    id: "commercial",
    label: "Global commercial",
    countries: ["SG", "US", "GB", "AU", "CN", "GLOBAL"],
  },
  {
    id: "all",
    label: "All countries",
    countries: COUNTRIES.map((country) => country.code),
  },
];

export const CATEGORIES = [
  { id: "cultural", label: "Cultural", color: "#c46b3a" },
  { id: "national", label: "National", color: "#5f8f6a" },
  { id: "religious", label: "Religious", color: "#6b5c9e" },
  { id: "commercial", label: "Commercial", color: "#c9892b" },
  { id: "seasonal", label: "Seasonal", color: "#3d7ea6" },
];

const EASTER = {
  2025: "2025-04-20",
  2026: "2026-04-05",
  2027: "2027-03-28",
};

export const FESTIVALS = [
  {
    id: "new-year",
    name: "New Year's Day",
    alsoKnownAs: ["1 January"],
    countries: [
      "SG",
      "MY",
      "ID",
      "TH",
      "VN",
      "PH",
      "CN",
      "HK",
      "TW",
      "JP",
      "KR",
      "IN",
      "AE",
      "US",
      "GB",
      "AU",
      "FR",
      "DE",
      "MX",
      "BR",
      "IT",
      "GLOBAL",
    ],
    category: "seasonal",
    date: { kind: "fixed", month: 1, day: 1 },
    publicHolidayIn: ["SG", "MY", "US", "GB", "AU", "CN", "JP", "KR", "FR", "DE"],
    leadDays: 21,
    summary:
      "Reset energy, resolutions, and first-of-the-year campaigns. In Singapore this is a gazetted public holiday.",
    whyItMatters:
      "High intent for fresh starts, fitness, finance, home, and ‘new year new me’ stories. Pair with countdown content from mid-December.",
    contentHooks: [
      "Year-in-review then year-ahead lists",
      "Resolution kits and first-week routines",
      "Lucky foods and first-sunrise rituals by culture",
    ],
    visuals: ["fireworks", "gold and red", "countdown clocks", "fresh florals"],
    hashtags: ["#NewYear", "#NewYearsDay"],
  },
  {
    id: "cny-eve",
    name: "Chinese New Year's Eve",
    alsoKnownAs: ["Reunion dinner", "除夕"],
    countries: ["SG", "MY", "CN", "HK", "TW", "VN", "ID"],
    category: "cultural",
    date: {
      kind: "map",
      byYear: { 2025: "2025-01-28", 2026: "2026-02-16", 2027: "2027-02-05" },
    },
    publicHolidayIn: ["CN"],
    leadDays: 35,
    summary:
      "The biggest family meal of the lunar year. In Singapore this is lohei, reunion dinner, and last-minute gift runs.",
    whyItMatters:
      "Food, tableware, outfits, and ang bao content peaks here. Brands usually launch 4–6 weeks earlier.",
    contentHooks: [
      "Reunion dinner menu and lohei toss order",
      "Host gifts and pantry extras",
      "What to wear for eve vs day one",
    ],
    visuals: ["round tables", "yu sheng", "oranges", "red envelopes"],
    hashtags: ["#CNYEve", "#ReunionDinner", "#LoHei"],
  },
  {
    id: "chinese-new-year",
    name: "Chinese New Year",
    alsoKnownAs: ["Spring Festival", "Lunar New Year", "春节", "Tết"],
    countries: ["SG", "MY", "CN", "HK", "TW", "VN", "ID", "KR", "GLOBAL"],
    category: "cultural",
    date: {
      kind: "span-map",
      byYear: {
        2025: { start: "2025-01-29", days: 2 },
        2026: { start: "2026-02-17", days: 2 },
        2027: { start: "2027-02-06", days: 2 },
      },
    },
    publicHolidayIn: ["SG", "MY", "CN", "HK", "TW", "VN", "KR"],
    leadDays: 45,
    summary:
      "Year of the Snake (2025), Horse (2026), Goat (2027). Singapore’s two-day public holiday and the city’s loudest cultural season.",
    whyItMatters:
      "The highest-stakes content window for SG food, fashion, beauty, and family brands. Open campaigns in early January.",
    contentHooks: [
      "Zodiac dressing and lucky colours",
      "Ang bao etiquette and visiting order",
      "CNY snacks: pineapple tarts, kueh, nian gao",
      "Chinatown light-up and temple visits",
    ],
    visuals: ["red and gold", "blossoms", "lion dance", "lantern streets"],
    hashtags: ["#ChineseNewYear", "#LunarNewYear", "#CNY"],
  },
  {
    id: "lantern-festival",
    name: "Lantern Festival",
    alsoKnownAs: ["Chap Goh Mei", "元宵节", "Yuanxiao"],
    countries: ["SG", "MY", "CN", "HK", "TW"],
    category: "cultural",
    date: {
      kind: "map",
      byYear: { 2025: "2025-02-12", 2026: "2026-03-03", 2027: "2027-02-20" },
    },
    publicHolidayIn: [],
    leadDays: 14,
    summary:
      "15th day of the first lunar month. Tangyuan, lanterns, and in Malaysia/Singapore the Hokkien Chap Goh Mei close of CNY.",
    whyItMatters:
      "A gentle second beat after CNY. Good for dessert, date-night, and ‘last day to visit’ content.",
    contentHooks: [
      "Tangyuan / glutinous rice ball recipes",
      "Lantern walks and night photography",
      "Chap Goh Mei as the official end of CNY",
    ],
    visuals: ["red lanterns", "full moon", "tangyuan"],
    hashtags: ["#LanternFestival", "#ChapGohMei"],
  },
  {
    id: "thaipusam",
    name: "Thaipusam",
    alsoKnownAs: [],
    countries: ["SG", "MY", "IN"],
    category: "religious",
    date: {
      kind: "map",
      byYear: { 2025: "2025-02-11", 2026: "2026-02-01", 2027: "2027-01-22" },
    },
    publicHolidayIn: ["MY"],
    leadDays: 14,
    summary:
      "Tamil Hindu festival honouring Lord Murugan. In Singapore, devotees walk from Sri Srinivasa Perumal Temple to Tank Road.",
    whyItMatters:
      "Powerful visual documentary content. Treat with respect: explain the vow, milk pots, and kavadi rather than spectacle-only clips.",
    contentHooks: [
      "What Thaipusam means and how the procession works",
      "Offerings of milk, fruit, and flowers",
      "Neighbourhood guide around Serangoon Road",
    ],
    visuals: ["kavadi", "yellow and saffron", "milk pots", "peacock motifs"],
    hashtags: ["#Thaipusam"],
  },
  {
    id: "valentine",
    name: "Valentine's Day",
    alsoKnownAs: [],
    countries: [
      "SG",
      "MY",
      "JP",
      "KR",
      "US",
      "GB",
      "AU",
      "FR",
      "IT",
      "GLOBAL",
    ],
    category: "commercial",
    date: { kind: "fixed", month: 2, day: 14 },
    publicHolidayIn: [],
    leadDays: 21,
    summary:
      "Romance commerce worldwide. In Japan and Korea, women traditionally gift chocolate; White Day returns the gesture a month later.",
    whyItMatters:
      "Reliable gifting, dining, and florals spike. In SG, couple cafes and hotel afternoon teas book out.",
    contentHooks: [
      "Gift guides under a few price tiers",
      "Galentine / friendship reframes",
      "JP/KR chocolate etiquette vs Western roses",
    ],
    visuals: ["red roses", "chocolate", "soft pink"],
    hashtags: ["#ValentinesDay"],
  },
  {
    id: "ramadan",
    name: "Ramadan",
    alsoKnownAs: ["Puasa"],
    countries: ["SG", "MY", "ID", "AE", "IN", "GLOBAL"],
    category: "religious",
    date: {
      kind: "span-map",
      byYear: {
        2025: { start: "2025-03-01", days: 30 },
        2026: { start: "2026-02-18", days: 31 },
        2027: { start: "2027-02-08", days: 30 },
      },
    },
    publicHolidayIn: [],
    leadDays: 21,
    summary:
      "Holy month of fasting from dawn to sunset. Dates can shift by a day with moon sighting. In Singapore, Geylang Serai and bazaars lead the visual story.",
    whyItMatters:
      "Iftar recipes, modest fashion, charity, and late-night bazaar content. Avoid food-push creatives at fasting hours.",
    contentHooks: [
      "Iftar table ideas and dates-and-water openers",
      "Geylang Serai / Kampong Gelam night markets",
      "Community and giving stories",
    ],
    visuals: ["crescent moon", "lanterns", "dates", "night bazaars"],
    hashtags: ["#Ramadan", "#Puasa"],
  },
  {
    id: "hari-raya-puasa",
    name: "Hari Raya Puasa",
    alsoKnownAs: ["Eid al-Fitr", "Hari Raya Aidilfitri"],
    countries: ["SG", "MY", "ID", "AE", "IN", "GLOBAL"],
    category: "religious",
    date: {
      kind: "map",
      byYear: { 2025: "2025-03-31", 2026: "2026-03-21", 2027: "2027-03-10" },
    },
    publicHolidayIn: ["SG", "MY", "ID", "AE"],
    leadDays: 28,
    summary:
      "Marks the end of Ramadan. Singapore gazetted public holiday. Open houses, kuih, ketupat, and new baju raya.",
    whyItMatters:
      "Fashion, home, and kuih content should be live 3–4 weeks out. Green-and-gold palettes, family visiting, and maaf zahir dan batin.",
    contentHooks: [
      "Baju raya looks and kids’ festive wear",
      "Kuih raya trays and cookie tins",
      "Open-house hosting and visiting etiquette",
    ],
    visuals: ["ketupat", "green and gold", "oil lamps", "cookies"],
    hashtags: ["#HariRaya", "#EidMubarak", "#HariRayaPuasa"],
  },
  {
    id: "holi",
    name: "Holi",
    alsoKnownAs: ["Festival of Colours"],
    countries: ["IN", "SG", "MY", "GLOBAL"],
    category: "cultural",
    date: {
      kind: "map",
      byYear: { 2025: "2025-03-14", 2026: "2026-03-03", 2027: "2027-03-22" },
    },
    publicHolidayIn: ["IN"],
    leadDays: 14,
    summary:
      "Hindu spring festival of colours, play, and renewal. Growing public celebrations in Singapore.",
    whyItMatters:
      "Highly visual. Good for colour, music, and community stories — keep the religious origin in the caption.",
    contentHooks: [
      "Colour play and outfit protection tips",
      "Sweets: gujiya, thandai",
      "What Holi commemorates",
    ],
    visuals: ["coloured powder", "white clothes", "spring florals"],
    hashtags: ["#Holi", "#FestivalOfColours"],
  },
  {
    id: "white-day",
    name: "White Day",
    alsoKnownAs: [],
    countries: ["JP", "KR", "TW", "CN"],
    category: "commercial",
    date: { kind: "fixed", month: 3, day: 14 },
    publicHolidayIn: [],
    leadDays: 14,
    summary:
      "Answer to Valentine’s Day in Japan, Korea, and parts of East Asia. Traditionally the day to return gifts, often white chocolate.",
    whyItMatters:
      "A second gifting beat for beauty and confectionery targeting JP/KR audiences.",
    contentHooks: [
      "Return-gift etiquette (triple the value lore)",
      "White chocolate and marshmallow sets",
      "Couple vs obligation-chocolate jokes",
    ],
    visuals: ["white chocolate", "pastel wrapping"],
    hashtags: ["#WhiteDay"],
  },
  {
    id: "good-friday",
    name: "Good Friday",
    alsoKnownAs: [],
    countries: ["SG", "MY", "GB", "AU", "US", "DE", "PH"],
    category: "religious",
    date: { kind: "easter", offset: -2 },
    publicHolidayIn: ["SG", "GB", "AU", "DE", "PH"],
    leadDays: 14,
    summary:
      "Christian commemoration of the Crucifixion. Public holiday in Singapore.",
    whyItMatters:
      "Quiet, reflective tone. Hot cross buns and church services; avoid loud promo energy.",
    contentHooks: [
      "Hot cross buns and bakery drops",
      "Long weekend plans with Easter Sunday",
      "Meaning of the day, simply told",
    ],
    visuals: ["hot cross buns", "church interiors", "muted florals"],
    hashtags: ["#GoodFriday"],
  },
  {
    id: "easter",
    name: "Easter Sunday",
    alsoKnownAs: [],
    countries: ["SG", "GB", "AU", "US", "FR", "DE", "IT", "PH", "GLOBAL"],
    category: "religious",
    date: { kind: "easter", offset: 0 },
    publicHolidayIn: ["GB", "AU", "FR", "DE", "IT"],
    leadDays: 21,
    summary:
      "Christian celebration of the Resurrection, plus a global spring/chocolate commercial layer.",
    whyItMatters:
      "Egg hunts, brunch, pastel palettes, and chocolate. In SG it is not a public holiday but retail leans in.",
    contentHooks: [
      "Egg hunt and brunch menus",
      "Chocolate egg gift guides",
      "Spring pastels and florals",
    ],
    visuals: ["eggs", "bunnies", "pastels", "lilies"],
    hashtags: ["#Easter"],
  },
  {
    id: "qingming",
    name: "Qingming Festival",
    alsoKnownAs: ["Tomb-Sweeping Day", "清明节"],
    countries: ["SG", "MY", "CN", "HK", "TW"],
    category: "cultural",
    date: {
      kind: "map",
      byYear: { 2025: "2025-04-04", 2026: "2026-04-05", 2027: "2027-04-05" },
    },
    publicHolidayIn: ["CN", "HK", "TW"],
    leadDays: 10,
    summary:
      "Families visit graves, clean tombs, and offer food. Also a spring outing day in China.",
    whyItMatters:
      "Sensitive ancestor-honouring content. In SG, traffic to cemeteries and columbaria; paper offerings and simple family stories work better than jokes.",
    contentHooks: [
      "What Qingming is and how families observe it",
      "Spring picnic / outing reframe in China",
      "Respectful offering lists",
    ],
    visuals: ["spring willow", "incense", "green hills"],
    hashtags: ["#Qingming", "#TombSweepingDay"],
  },
  {
    id: "songkran",
    name: "Songkran",
    alsoKnownAs: ["Thai New Year"],
    countries: ["TH", "SG"],
    category: "cultural",
    date: {
      kind: "span-fixed",
      month: 4,
      day: 13,
      days: 3,
    },
    publicHolidayIn: ["TH"],
    leadDays: 14,
    summary:
      "Thai New Year water festival, 13–15 April. Blessing with water, family visits, and city-wide water fights.",
    whyItMatters:
      "Travel and F&B content for Thailand; in Singapore, Golden Mile / Thai community celebrations.",
    contentHooks: [
      "Water-festival packing and phone protection",
      "Traditional blessing vs party Songkran",
      "Thai food menus for the new year",
    ],
    visuals: ["water splashes", "marigolds", "white shirts"],
    hashtags: ["#Songkran", "#ThaiNewYear"],
  },
  {
    id: "labour-day",
    name: "Labour Day",
    alsoKnownAs: ["May Day"],
    countries: ["SG", "MY", "CN", "FR", "DE", "ID", "TH", "VN", "PH"],
    category: "national",
    date: { kind: "fixed", month: 5, day: 1 },
    publicHolidayIn: ["SG", "MY", "CN", "FR", "DE", "ID"],
    leadDays: 10,
    summary:
      "Workers’ day and a Singapore public holiday. Often a long-weekend staycation trigger.",
    whyItMatters:
      "Staycation, local travel, and ‘treat the team’ content. In China it is a multi-day Golden Week style holiday.",
    contentHooks: [
      "SG staycation and day-trip lists",
      "Worker appreciation / behind-the-scenes",
      "Long-weekend recipes",
    ],
    visuals: ["city skyline", "picnics", "hotel pools"],
    hashtags: ["#LabourDay", "#MayDay"],
  },
  {
    id: "vesak",
    name: "Vesak Day",
    alsoKnownAs: ["Buddha's Birthday", "Wesak"],
    countries: ["SG", "MY", "TH", "VN", "KR", "CN"],
    category: "religious",
    date: {
      kind: "map",
      byYear: { 2025: "2025-05-12", 2026: "2026-05-31", 2027: "2027-05-20" },
    },
    publicHolidayIn: ["SG", "MY", "KR", "TH"],
    leadDays: 14,
    summary:
      "Commemorates the birth, enlightenment, and passing of the Buddha. Singapore public holiday (observed Monday 1 Jun 2026).",
    whyItMatters:
      "Temple light-ups, lotus, vegetarian food, and charity. Keep the tone calm and educational.",
    contentHooks: [
      "Temple visits and lantern lighting",
      "Vegetarian / plant-based menus",
      "Lotus and light visual essays",
    ],
    visuals: ["lotus", "candles", "temples", "white and gold"],
    hashtags: ["#Vesak", "#Wesak"],
  },
  {
    id: "hari-raya-haji",
    name: "Hari Raya Haji",
    alsoKnownAs: ["Eid al-Adha", "Hari Raya Aidiladha"],
    countries: ["SG", "MY", "ID", "AE", "IN", "GLOBAL"],
    category: "religious",
    date: {
      kind: "map",
      byYear: { 2025: "2025-06-07", 2026: "2026-05-27", 2027: "2027-05-17" },
    },
    publicHolidayIn: ["SG", "MY", "ID", "AE"],
    leadDays: 18,
    summary:
      "Festival of Sacrifice, tied to Hajj. Singapore public holiday. Korban and communal meals.",
    whyItMatters:
      "Community, charity, and family visiting. Smaller fashion peak than Puasa, stronger giving stories.",
    contentHooks: [
      "What Haji / Adha commemorates",
      "Korban and sharing meat with neighbours",
      "Prayer and open-house rhythms",
    ],
    visuals: ["mosque mornings", "white prayer clothes", "shared meals"],
    hashtags: ["#HariRayaHaji", "#EidAlAdha"],
  },
  {
    id: "mothers-day",
    name: "Mother's Day",
    alsoKnownAs: [],
    countries: ["SG", "MY", "US", "GB", "AU", "IN", "CN", "JP", "GLOBAL"],
    category: "commercial",
    date: { kind: "nth-weekday", month: 5, weekday: 0, n: 2 },
    publicHolidayIn: [],
    leadDays: 21,
    summary:
      "Second Sunday of May in Singapore and most markets (UK is earlier, in Lent — we use the May date here as the SG/US commercial day).",
    whyItMatters:
      "Flowers, brunch, jewellery, and family portraits. High conversion if you publish gift guides 2–3 weeks out.",
    contentHooks: [
      "Gift guides by budget and personality",
      "Brunch and homemade breakfast",
      "Stories of mum-owned businesses",
    ],
    visuals: ["peonies", "handwritten notes", "brunch tables"],
    hashtags: ["#MothersDay"],
  },
  {
    id: "dragon-boat",
    name: "Dragon Boat Festival",
    alsoKnownAs: ["Duanwu", "端午节", "Rice Dumpling Festival"],
    countries: ["SG", "MY", "CN", "HK", "TW"],
    category: "cultural",
    date: {
      kind: "map",
      byYear: { 2025: "2025-05-31", 2026: "2026-06-19", 2027: "2027-06-09" },
    },
    publicHolidayIn: ["CN", "HK", "TW"],
    leadDays: 18,
    summary:
      "Fifth day of the fifth lunar month. Zongzi / bak chang, dragon boat races, and the legend of Qu Yuan.",
    whyItMatters:
      "A food-led content day in Singapore. Bak chang drops start about two weeks prior.",
    contentHooks: [
      "Nyonya vs traditional bak chang fillings",
      "Where to watch races (e.g. Bedok Reservoir)",
      "Qu Yuan story in one minute",
    ],
    visuals: ["bamboo leaves", "dragon boats", "rice dumplings"],
    hashtags: ["#DragonBoatFestival", "#Duanwu", "#BakChang"],
  },
  {
    id: "fathers-day",
    name: "Father's Day",
    alsoKnownAs: [],
    countries: ["SG", "MY", "US", "GB", "AU", "IN", "JP", "GLOBAL"],
    category: "commercial",
    date: { kind: "nth-weekday", month: 6, weekday: 0, n: 3 },
    publicHolidayIn: [],
    leadDays: 18,
    summary: "Third Sunday of June in Singapore, the US, the UK, and others.",
    whyItMatters:
      "Gifting, grilling, and ‘teach me something dad does’ stories. Slightly less floral, more hobby/tech/food.",
    contentHooks: [
      "Experience gifts over gadgets",
      "Recipes dad actually wants",
      "Father-child photo prompts",
    ],
    visuals: ["weekend breakfast", "tools and books", "navy and tan"],
    hashtags: ["#FathersDay"],
  },
  {
    id: "singapore-youth-day",
    name: "Youth Day (Singapore)",
    alsoKnownAs: [],
    countries: ["SG"],
    category: "national",
    date: { kind: "nth-weekday", month: 7, weekday: 0, n: 1 },
    publicHolidayIn: [],
    leadDays: 10,
    summary: "First Sunday of July. School-adjacent, not a public holiday.",
    whyItMatters: "Student, camp, and youth-brand content. Light civic tone.",
    contentHooks: [
      "Study / side-hustle stories",
      "Youth-led brands in Singapore",
      "School holiday activity lists",
    ],
    visuals: ["school colours", "sports days"],
    hashtags: ["#YouthDay"],
  },
  {
    id: "racial-harmony-day",
    name: "Racial Harmony Day",
    alsoKnownAs: [],
    countries: ["SG"],
    category: "national",
    date: { kind: "fixed", month: 7, day: 21 },
    publicHolidayIn: [],
    leadDays: 10,
    summary:
      "Commemorates the 1964 racial riots and Singapore’s multicultural compact. Observed in schools.",
    whyItMatters:
      "Heritage clothes, food of the four main cultures, and community stories. Avoid tokenism — specific dishes and people work better than generic ‘diversity’ graphics.",
    contentHooks: [
      "Traditional dress across cultures",
      "Neighbourhood food trails",
      "Classroom and workplace sharing moments",
    ],
    visuals: ["sarong kebaya", "cheongsam", "saris", "songkok"],
    hashtags: ["#RacialHarmonyDay"],
  },
  {
    id: "national-day-sg",
    name: "National Day (Singapore)",
    alsoKnownAs: ["NDP"],
    countries: ["SG"],
    category: "national",
    date: { kind: "fixed", month: 8, day: 9 },
    publicHolidayIn: ["SG"],
    leadDays: 28,
    summary:
      "Singapore’s independence day. Parade, fireworks, red-and-white everywhere. In 2026 the holiday falls on Sunday, so Monday 10 Aug is observed.",
    whyItMatters:
      "Biggest local patriotic content day. NDP song, fun packs, heartland parties, and SG60-style lookbacks. Start red-white assets in July.",
    contentHooks: [
      "NDP watch parties and fireworks vantage points",
      "Heartland food that feels ‘very Singapore’",
      "Then-and-now neighbourhood stories",
    ],
    visuals: ["red and white", "fireworks", "Padang", "lion head"],
    hashtags: ["#NationalDay", "#NDP", "#Singapore"],
  },
  {
    id: "f1-singapore",
    name: "Singapore Grand Prix",
    alsoKnownAs: ["F1 Singapore", "Night Race"],
    countries: ["SG"],
    category: "seasonal",
    date: {
      kind: "span-map",
      byYear: {
        2025: { start: "2025-10-03", days: 3 },
        2026: { start: "2026-10-09", days: 3 },
        2027: { start: "2027-10-08", days: 3 },
      },
    },
    publicHolidayIn: [],
    leadDays: 21,
    summary:
      "Formula 1 night race around Marina Bay. Weekend of practice, qualifying, and the race.",
    whyItMatters:
      "City-wide hospitality, fashion, hotel, and nightlife content. Road closures and tourist crowds. Publish venue and outfit guides two weeks out.",
    contentHooks: [
      "Where to watch without a grandstand ticket",
      "Night-race outfits and after-parties",
      "Marina Bay food during race weekend",
    ],
    visuals: ["floodlit street circuit", "skyline at night", "cars"],
    hashtags: ["#SingaporeGP", "#F1"],
  },
  {
    id: "qixi",
    name: "Qixi Festival",
    alsoKnownAs: ["Chinese Valentine's Day", "七夕"],
    countries: ["CN", "HK", "TW", "SG", "MY"],
    category: "cultural",
    date: {
      kind: "map",
      byYear: { 2025: "2025-08-29", 2026: "2026-08-19", 2027: "2027-08-08" },
    },
    publicHolidayIn: [],
    leadDays: 12,
    summary:
      "Seventh night of the seventh lunar month. The Cowherd and Weaver Girl legend — East Asia’s traditional lovers’ day.",
    whyItMatters:
      "A romance beat distinct from 14 Feb. Strong in China e-commerce; in SG a quieter cultural story you can pair with stargazing or dessert.",
    contentHooks: [
      "The Qixi legend in a short comic",
      "Date ideas under the night sky",
      "Contrast with Valentine’s and White Day",
    ],
    visuals: ["magpies", "night sky", "red thread"],
    hashtags: ["#Qixi", "#ChineseValentinesDay"],
  },
  {
    id: "hungry-ghost-month",
    name: "Hungry Ghost Month",
    alsoKnownAs: ["Seventh Month", "鬼月"],
    countries: ["SG", "MY", "CN", "HK", "TW"],
    category: "cultural",
    date: {
      kind: "span-map",
      byYear: {
        2025: { start: "2025-08-23", days: 30 },
        2026: { start: "2026-08-13", days: 30 },
        2027: { start: "2027-08-02", days: 29 },
      },
    },
    publicHolidayIn: [],
    leadDays: 10,
    summary:
      "Seventh lunar month, when spirits are said to roam. Getai, roadside offerings, and a quieter month for moving house or weddings in some families.",
    whyItMatters:
      "In Singapore this is a living street culture story (getai, incense, paper offerings). Also a caution month for property, wedding, and ‘lucky date’ content.",
    contentHooks: [
      "What not to do in the seventh month, explained kindly",
      "Getai nights as live performance culture",
      "Offering etiquette for the uninitiated",
    ],
    visuals: ["joss paper", "getai stages", "incense at night"],
    hashtags: ["#HungryGhostFestival", "#SeventhMonth"],
  },
  {
    id: "hungry-ghost-festival",
    name: "Hungry Ghost Festival",
    alsoKnownAs: ["Zhongyuan", "中元节"],
    countries: ["SG", "MY", "CN", "HK", "TW"],
    category: "cultural",
    date: {
      kind: "map",
      byYear: { 2025: "2025-09-06", 2026: "2026-08-27", 2027: "2027-08-16" },
    },
    publicHolidayIn: [],
    leadDays: 10,
    summary:
      "15th day of the seventh lunar month — the peak of Ghost Month. Offerings for ancestors and wandering spirits.",
    whyItMatters:
      "One-night visual peak inside the longer month. Good for documentary, food-for-spirits, and neighbourhood night walks.",
    contentHooks: [
      "Peak-night offerings and opera / getai",
      "Ancestral vs wandering-spirit trays",
      "How the date moves each year",
    ],
    visuals: ["full moon", "paper houses", "street altars"],
    hashtags: ["#Zhongyuan", "#HungryGhostFestival"],
  },
  {
    id: "teachers-day-sg",
    name: "Teachers' Day (Singapore)",
    alsoKnownAs: [],
    countries: ["SG"],
    category: "national",
    date: { kind: "fixed", month: 9, day: 1 },
    publicHolidayIn: [],
    leadDays: 12,
    summary: "School holiday in Singapore for honouring teachers.",
    whyItMatters: "Cards, snacks, and thank-you content. PTA and stationery brands lean in.",
    contentHooks: [
      "Thank-you notes and small gifts that are actually useful",
      "Teacher stories and first-classroom memories",
    ],
    visuals: ["apples and stationery", "handwritten cards"],
    hashtags: ["#TeachersDay"],
  },
  {
    id: "mid-autumn",
    name: "Mid-Autumn Festival",
    alsoKnownAs: ["Mooncake Festival", "中秋节", "Tết Trung Thu"],
    countries: ["SG", "MY", "CN", "HK", "TW", "VN"],
    category: "cultural",
    date: {
      kind: "map",
      byYear: { 2025: "2025-10-06", 2026: "2026-09-25", 2027: "2027-09-15" },
    },
    publicHolidayIn: ["CN", "HK", "TW"],
    leadDays: 35,
    summary:
      "15th day of the eighth lunar month — full harvest moon, mooncakes, lanterns, and reunion. Not a public holiday in Singapore, but culturally huge.",
    whyItMatters:
      "Mooncake collaborations drop 3–4 weeks early. Lantern walks at Gardens by the Bay / Chinatown, snow-skin vs traditional, and family terrace moon-viewing are the SG content pillars.",
    contentHooks: [
      "Mooncake flavour round-ups and gift tins",
      "Lantern-making with kids",
      "Chang’e and the moon rabbit, retold",
      "Where to see the full moon in Singapore",
    ],
    visuals: ["full moon", "cellophane lanterns", "mooncakes", "osmanthus"],
    hashtags: ["#MidAutumnFestival", "#MooncakeFestival", "#中秋节"],
  },
  {
    id: "chuseok",
    name: "Chuseok",
    alsoKnownAs: ["Korean Thanksgiving", "추석"],
    countries: ["KR"],
    category: "cultural",
    date: {
      kind: "span-map",
      byYear: {
        2025: { start: "2025-10-05", days: 3 },
        2026: { start: "2026-09-24", days: 3 },
        2027: { start: "2027-09-14", days: 3 },
      },
    },
    publicHolidayIn: ["KR"],
    leadDays: 21,
    summary:
      "Korea’s harvest homecoming, on the same lunar full moon as Mid-Autumn. Songpyeon, ancestral rites, and mass travel.",
    whyItMatters:
      "If you make Korea-facing content, this is the autumn peak — gift sets, travel chaos, and family food.",
    contentHooks: [
      "Songpyeon and charye table",
      "Seoul empties / hometown roads",
      "How Chuseok relates to Mid-Autumn",
    ],
    visuals: ["songpyeon", "hanbok", "full moon", "pine"],
    hashtags: ["#Chuseok", "#추석"],
  },
  {
    id: "childrens-day-sg",
    name: "Children's Day (Singapore)",
    alsoKnownAs: [],
    countries: ["SG"],
    category: "national",
    date: { kind: "fixed", month: 10, day: 1 },
    publicHolidayIn: [],
    leadDays: 12,
    summary: "Observed in primary schools on 1 October.",
    whyItMatters: "Kids’ activities, family F&B, and education brands.",
    contentHooks: [
      "Playground and museum day lists",
      "Lunchbox treats",
      "Notes from parents to kids",
    ],
    visuals: ["balloons", "primary colours", "playgrounds"],
    hashtags: ["#ChildrensDay"],
  },
  {
    id: "china-national-day",
    name: "China National Day Golden Week",
    alsoKnownAs: ["国庆节"],
    countries: ["CN"],
    category: "national",
    date: { kind: "span-fixed", month: 10, day: 1, days: 7 },
    publicHolidayIn: ["CN"],
    leadDays: 21,
    summary: "1–7 October travel peak in mainland China.",
    whyItMatters:
      "Huge domestic travel and e-commerce window. Crowds, tickets, and patriotic creatives.",
    contentHooks: [
      "Travel vs staycation tradeoffs",
      "Flag-raising and red-theme design",
      "Golden Week survival guides",
    ],
    visuals: ["red flags", "Tiananmen", "crowded stations"],
    hashtags: ["#GoldenWeek", "#NationalDay"],
  },
  {
    id: "nine-emperor-gods",
    name: "Nine Emperor Gods Festival",
    alsoKnownAs: ["九皇爷"],
    countries: ["SG", "MY", "TH"],
    category: "religious",
    date: {
      kind: "span-map",
      byYear: {
        2025: { start: "2025-10-21", days: 9 },
        2026: { start: "2026-10-11", days: 9 },
        2027: { start: "2027-09-30", days: 9 },
      },
    },
    publicHolidayIn: [],
    leadDays: 10,
    summary:
      "Nine days of the ninth lunar month. Vegetarian vows, yellow headscarves, and temple processions — strong in Singapore and Penang.",
    whyItMatters:
      "Distinctive SG/MY visual culture. Vegetarian menus and temple night photography; be respectful around trance and piercings.",
    contentHooks: [
      "Why devotees wear yellow",
      "Vegetarian eating for nine days",
      "Kew Huang Keng and other temple processions",
    ],
    visuals: ["yellow robes", "palanquins", "night temples"],
    hashtags: ["#NineEmperorGods"],
  },
  {
    id: "deepavali",
    name: "Deepavali",
    alsoKnownAs: ["Diwali", "Festival of Lights"],
    countries: ["SG", "MY", "IN", "GLOBAL"],
    category: "religious",
    date: {
      kind: "map",
      byYear: { 2025: "2025-10-20", 2026: "2026-11-08", 2027: "2027-10-28" },
    },
    publicHolidayIn: ["SG", "MY", "IN"],
    leadDays: 21,
    summary:
      "Hindu festival of lights, celebrating Rama’s return and the victory of light over darkness. Singapore public holiday (observed Monday 9 Nov 2026).",
    whyItMatters:
      "Little India light-up, kolam, sweets, and new clothes. One of SG’s four major cultural festivals — plan light-up visits and mithai guides two weeks out.",
    contentHooks: [
      "Little India light-up walking route",
      "Kolam / rangoli how-tos",
      "Mithai and savoury snack trays",
      "Oil lamps and balcony lighting",
    ],
    visuals: ["diyas", "rangoli", "gold on deep colour", "fairy lights"],
    hashtags: ["#Deepavali", "#Diwali"],
  },
  {
    id: "halloween",
    name: "Halloween",
    alsoKnownAs: [],
    countries: ["US", "GB", "AU", "SG", "JP", "KR", "GLOBAL"],
    category: "commercial",
    date: { kind: "fixed", month: 10, day: 31 },
    publicHolidayIn: [],
    leadDays: 21,
    summary:
      "Costume and confectionery night. In Singapore it is imported-but-busy: Universal, bars, and malls.",
    whyItMatters:
      "Costume, F&B horror menus, and kid-friendly pumpkin content. Pair with Hungry Ghost only carefully — different origins.",
    contentHooks: [
      "Costume DIY vs last-minute mall runs",
      "Kid-safe vs adult-party tracks",
      "Pumpkin recipes that are not sad soup",
    ],
    visuals: ["orange and black", "pumpkins", "costumes"],
    hashtags: ["#Halloween"],
  },
  {
    id: "singles-day",
    name: "Singles' Day",
    alsoKnownAs: ["11.11"],
    countries: ["CN", "SG", "MY", "GLOBAL"],
    category: "commercial",
    date: { kind: "fixed", month: 11, day: 11 },
    publicHolidayIn: [],
    leadDays: 14,
    summary:
      "World’s largest online shopping day, born in China. Also Pepero Day in Korea.",
    whyItMatters: "Pure commerce. Wishlist, deal stacks, and anti-haul commentary all work.",
    contentHooks: [
      "Wishlist building before midnight",
      "Pepero / 11.11 snack pairings in Korea",
      "What is actually worth buying",
    ],
    visuals: ["11.11 graphics", "shopping bags", "pepero sticks"],
    hashtags: ["#1111", "#SinglesDay"],
  },
  {
    id: "thanksgiving-us",
    name: "Thanksgiving (US)",
    alsoKnownAs: [],
    countries: ["US"],
    category: "cultural",
    date: { kind: "nth-weekday", month: 11, weekday: 4, n: 4 },
    publicHolidayIn: ["US"],
    leadDays: 21,
    summary: "Fourth Thursday of November. Harvest meal and the start of US holiday shopping.",
    whyItMatters:
      "Recipes, table settings, and travel. Black Friday follows immediately — plan a two-step calendar.",
    contentHooks: [
      "Menu timelines and make-ahead dishes",
      "Friendsgiving for people far from home",
      "What to watch / cook in Singapore for US-audience brands",
    ],
    visuals: ["roast dinner", "autumn leaves", "checked tablecloths"],
    hashtags: ["#Thanksgiving"],
  },
  {
    id: "black-friday",
    name: "Black Friday",
    alsoKnownAs: [],
    countries: ["US", "GB", "SG", "AU", "GLOBAL"],
    category: "commercial",
    date: { kind: "nth-weekday", month: 11, weekday: 4, n: 4, offsetDays: 1 },
    publicHolidayIn: [],
    leadDays: 14,
    summary: "Day after US Thanksgiving. Globalised discount weekend, including Singapore retailers.",
    whyItMatters: "Deal round-ups, honesty about fake discounts, and gift-list content.",
    contentHooks: [
      "Price-drop trackers and ‘wait vs buy’",
      "Gift lists by person",
      "Cyber Monday follow-through",
    ],
    visuals: ["sale tags", "shopping night"],
    hashtags: ["#BlackFriday"],
  },
  {
    id: "christmas",
    name: "Christmas Day",
    alsoKnownAs: [],
    countries: [
      "SG",
      "MY",
      "US",
      "GB",
      "AU",
      "FR",
      "DE",
      "IT",
      "PH",
      "KR",
      "HK",
      "GLOBAL",
    ],
    category: "religious",
    date: { kind: "fixed", month: 12, day: 25 },
    publicHolidayIn: ["SG", "MY", "US", "GB", "AU", "FR", "DE", "IT", "PH", "KR", "HK"],
    leadDays: 45,
    summary:
      "Christian nativity and the global gifting season. Singapore public holiday. Orchard Road light-up is the local visual icon.",
    whyItMatters:
      "Longest commercial runway of the year. Light-up content from November; gifts and menus from early December; quiet religious posts on the day itself.",
    contentHooks: [
      "Orchard / Botanic Gardens / neighbourhood light-ups",
      "Tropical Christmas menus (no fireplace required)",
      "Gift wrapping and cookie tins",
      "Church service times vs family lunch",
    ],
    visuals: ["warm lights", "red and green", "trees", "cookies"],
    hashtags: ["#Christmas", "#ChristmasInSingapore"],
  },
  {
    id: "new-years-eve",
    name: "New Year's Eve",
    alsoKnownAs: ["31 December"],
    countries: [
      "SG",
      "US",
      "GB",
      "AU",
      "JP",
      "KR",
      "FR",
      "AE",
      "GLOBAL",
    ],
    category: "seasonal",
    date: { kind: "fixed", month: 12, day: 31 },
    publicHolidayIn: [],
    leadDays: 18,
    summary: "Fireworks, hotel balls, and Marina Bay in Singapore.",
    whyItMatters: "Outfit, countdown venue, and ‘what to leave behind’ essays.",
    contentHooks: [
      "Where to watch fireworks without the crush",
      "At-home countdown menus",
      "Year-end reflections that are not generic",
    ],
    visuals: ["fireworks", "sequins", "clocks at midnight"],
    hashtags: ["#NewYearsEve"],
  },
  {
    id: "winter-solstice",
    name: "Winter Solstice",
    alsoKnownAs: ["Dongzhi", "冬至"],
    countries: ["SG", "MY", "CN", "HK", "TW"],
    category: "cultural",
    date: {
      kind: "map",
      byYear: { 2025: "2025-12-21", 2026: "2026-12-21", 2027: "2027-12-22" },
    },
    publicHolidayIn: [],
    leadDays: 10,
    summary:
      "Shortest day of the year. Chinese families eat tangyuan to mark a completed year of age.",
    whyItMatters:
      "Quiet, cozy food content — a second tangyuan moment after Lantern Festival, and a family check-in before Christmas.",
    contentHooks: [
      "Tangyuan colours and fillings",
      "Why some families count age at Dongzhi",
      "Longest-night photography",
    ],
    visuals: ["tangyuan in syrup", "night windows", "steam"],
    hashtags: ["#Dongzhi", "#WinterSolstice"],
  },
  {
    id: "total-defence-day",
    name: "Total Defence Day",
    alsoKnownAs: [],
    countries: ["SG"],
    category: "national",
    date: { kind: "fixed", month: 2, day: 15 },
    publicHolidayIn: [],
    leadDays: 7,
    summary: "Marks the fall of Singapore in 1942. Observed in schools and national messaging.",
    whyItMatters: "Civic, heritage, and ‘how we prepare’ stories rather than party content.",
    contentHooks: [
      "Six pillars of Total Defence, explained simply",
      "Heritage trails and WWII sites",
    ],
    visuals: ["national colours", "heritage sites"],
    hashtags: ["#TotalDefenceDay"],
  },
  {
    id: "double-ninth",
    name: "Double Ninth Festival",
    alsoKnownAs: ["Chongyang", "重阳节"],
    countries: ["CN", "HK", "TW", "SG"],
    category: "cultural",
    date: {
      kind: "map",
      byYear: { 2025: "2025-10-29", 2026: "2026-10-18", 2027: "2027-10-08" },
    },
    publicHolidayIn: [],
    leadDays: 8,
    summary:
      "Ninth day of the ninth lunar month. Climbing high, chrysanthemums, and honouring the elderly.",
    whyItMatters: "Softer autumn story: elders, hiking, and chrysanthemum tea.",
    contentHooks: [
      "Hill or rooftop ‘climb high’ outings",
      "Chrysanthemum cakes and tea",
      "Notes to grandparents",
    ],
    visuals: ["chrysanthemums", "hills", "autumn haze"],
    hashtags: ["#DoubleNinth", "#Chongyang"],
  },
  {
    id: "seollal",
    name: "Seollal",
    alsoKnownAs: ["Korean Lunar New Year", "설날"],
    countries: ["KR"],
    category: "cultural",
    date: {
      kind: "span-map",
      byYear: {
        2025: { start: "2025-01-28", days: 3 },
        2026: { start: "2026-02-16", days: 3 },
        2027: { start: "2027-02-06", days: 3 },
      },
    },
    publicHolidayIn: ["KR"],
    leadDays: 28,
    summary: "Korea’s lunar new year: sebae bows, tteokguk, and ancestral rites.",
    whyItMatters: "Parallel to CNY with different food and dress. Useful if you localise for Korea.",
    contentHooks: [
      "Tteokguk and why a bowl equals a year of age",
      "Hanbok and sebae money",
      "Travel rush out of Seoul",
    ],
    visuals: ["hanbok", "white rice cakes", "family bows"],
    hashtags: ["#Seollal", "#설날"],
  },
  {
    id: "golden-week-jp",
    name: "Golden Week (Japan)",
    alsoKnownAs: [],
    countries: ["JP"],
    category: "national",
    date: { kind: "span-fixed", month: 4, day: 29, days: 7 },
    publicHolidayIn: ["JP"],
    leadDays: 21,
    summary:
      "String of Japanese holidays from late April into early May. Heavy domestic travel.",
    whyItMatters: "Japan travel content, closures, and crowded destinations.",
    contentHooks: [
      "What is actually closed",
      "Secondary-city trip ideas",
      "Children’s Day (5 May) koi nobori",
    ],
    visuals: ["koi streamers", "shinkansen", "fresh greens"],
    hashtags: ["#GoldenWeek"],
  },
  {
    id: "tanabata",
    name: "Tanabata",
    alsoKnownAs: ["Star Festival"],
    countries: ["JP"],
    category: "cultural",
    date: { kind: "fixed", month: 7, day: 7 },
    publicHolidayIn: [],
    leadDays: 10,
    summary:
      "Japan’s star festival (same legend as Qixi). Wishes on colourful tanzaku papers. Some cities celebrate in August.",
    whyItMatters: "Wish trees, summer yukata, and Sendai/Hiratsuka festival footage.",
    contentHooks: [
      "Write a wish on tanzaku",
      "Tanabata vs Qixi",
      "Summer festival food",
    ],
    visuals: ["bamboo with paper slips", "milky way", "yukata"],
    hashtags: ["#Tanabata"],
  },
  {
    id: "obon",
    name: "Obon",
    alsoKnownAs: ["Bon Festival"],
    countries: ["JP"],
    category: "cultural",
    date: { kind: "span-fixed", month: 8, day: 13, days: 4 },
    publicHolidayIn: [],
    leadDays: 14,
    summary:
      "Japanese days for welcoming ancestral spirits. Lanterns, Bon odori, and hometown travel. Mid-August in most regions.",
    whyItMatters: "Travel peak plus lantern rivers. Related-but-not-identical to Hungry Ghost.",
    contentHooks: [
      "Bon odori and yukata",
      "Toro nagashi lanterns on water",
      "How families welcome ancestors home",
    ],
    visuals: ["paper lanterns", "dance circles", "summer night"],
    hashtags: ["#Obon"],
  },
  {
    id: "hanami",
    name: "Cherry blossom season",
    alsoKnownAs: ["Hanami", "Sakura"],
    countries: ["JP", "KR"],
    category: "seasonal",
    date: { kind: "span-fixed", month: 3, day: 20, days: 22 },
    publicHolidayIn: [],
    leadDays: 14,
    summary:
      "Approximate Tokyo/Seoul peak window. Actual bloom moves with weather.",
    whyItMatters: "Travel and picnic content. Publish forecast explainers in March.",
    contentHooks: [
      "Bloom forecasts and how to read them",
      "Hanami picnic packing",
      "Night sakura (yozakura)",
    ],
    visuals: ["pink blossom", "bento on a tarp", "temple gates"],
    hashtags: ["#Sakura", "#Hanami"],
  },
  {
    id: "setsubun",
    name: "Setsubun",
    alsoKnownAs: [],
    countries: ["JP"],
    category: "cultural",
    date: { kind: "fixed", month: 2, day: 3 },
    publicHolidayIn: [],
    leadDays: 7,
    summary: "Bean-throwing to drive out ogres and welcome spring.",
    whyItMatters: "Playful, kid-friendly Japan content: oni masks and roasted soybeans.",
    contentHooks: [
      "Oni wa soto, fuku wa uchi",
      "Ehomaki uncut sushi roll (face the lucky direction)",
    ],
    visuals: ["red oni", "soybeans", "ehomaki"],
    hashtags: ["#Setsubun"],
  },
  {
    id: "loy-krathong",
    name: "Loy Krathong",
    alsoKnownAs: [],
    countries: ["TH"],
    category: "cultural",
    date: {
      kind: "map",
      byYear: { 2025: "2025-11-05", 2026: "2026-11-24", 2027: "2027-11-13" },
    },
    publicHolidayIn: [],
    leadDays: 12,
    summary:
      "Thai festival of floating offerings on the full moon of the 12th lunar month. Yi Peng lanterns in the north.",
    whyItMatters: "One of the most beautiful night visuals in SEA travel content.",
    contentHooks: [
      "How to float a krathong respectfully",
      "Yi Peng sky lanterns in Chiang Mai",
      "Rivers at night in Bangkok",
    ],
    visuals: ["floating flowers", "sky lanterns", "moon on water"],
    hashtags: ["#LoyKrathong", "#YiPeng"],
  },
  {
    id: "nyepi",
    name: "Nyepi",
    alsoKnownAs: ["Balinese New Year"],
    countries: ["ID"],
    category: "religious",
    date: {
      kind: "map",
      byYear: { 2025: "2025-03-29", 2026: "2026-03-19", 2027: "2027-03-08" },
    },
    publicHolidayIn: ["ID"],
    leadDays: 14,
    summary:
      "Day of Silence in Bali: no travel, lights, or noise. Ogoh-ogoh parades the day before.",
    whyItMatters:
      "Essential for Bali travel content — warn that the island shuts. Ogoh-ogoh is the visual peak.",
    contentHooks: [
      "What visitors can and cannot do",
      "Ogoh-ogoh the day before",
      "Quiet reset as a story, not a party",
    ],
    visuals: ["ogoh-ogoh monsters", "empty streets", "dawn"],
    hashtags: ["#Nyepi"],
  },
  {
    id: "indonesia-independence",
    name: "Indonesian Independence Day",
    alsoKnownAs: ["Hari Kemerdekaan"],
    countries: ["ID"],
    category: "national",
    date: { kind: "fixed", month: 8, day: 17 },
    publicHolidayIn: ["ID"],
    leadDays: 14,
    summary: "17 August. Flag ceremonies, competitions, and red-and-white nationwide.",
    whyItMatters: "Community games, panjat pinang, and patriotic food.",
    contentHooks: [
      "Kampung games and competitions",
      "Red-white looks and flags",
    ],
    visuals: ["red and white flags", "ceremonies"],
    hashtags: ["#HariKemerdekaan", "#17Agustus"],
  },
  {
    id: "malaysia-national-day",
    name: "Malaysia National Day",
    alsoKnownAs: ["Hari Merdeka"],
    countries: ["MY"],
    category: "national",
    date: { kind: "fixed", month: 8, day: 31 },
    publicHolidayIn: ["MY"],
    leadDays: 14,
    summary: "Independence from Britain, 31 August 1957.",
    whyItMatters: "Jalur Gemilang, parades, and patriotic commercial work.",
    contentHooks: [
      "Flag-raising and neighbourhood decorations",
      "Merdeka vs Malaysia Day (16 Sep) explained",
    ],
    visuals: ["Jalur Gemilang", "parades"],
    hashtags: ["#HariMerdeka", "#Malaysia"],
  },
  {
    id: "malaysia-day",
    name: "Malaysia Day",
    alsoKnownAs: [],
    countries: ["MY"],
    category: "national",
    date: { kind: "fixed", month: 9, day: 16 },
    publicHolidayIn: ["MY"],
    leadDays: 10,
    summary: "Formation of Malaysia in 1963, including Sabah and Sarawak.",
    whyItMatters: "East Malaysia stories, not only Peninsula.",
    contentHooks: [
      "Sabah and Sarawak food and craft",
      "How 16 Sep differs from 31 Aug",
    ],
    visuals: ["maps of the federation", "flags"],
    hashtags: ["#MalaysiaDay"],
  },
  {
    id: "vietnam-national-day",
    name: "Vietnam National Day",
    alsoKnownAs: [],
    countries: ["VN"],
    category: "national",
    date: { kind: "fixed", month: 9, day: 2 },
    publicHolidayIn: ["VN"],
    leadDays: 12,
    summary: "Declaration of independence, 2 September 1945.",
    whyItMatters: "Long weekend travel inside Vietnam; red flags with yellow star.",
    contentHooks: ["Hanoi and HCMC celebrations", "Holiday travel notes"],
    visuals: ["red flags", "street celebrations"],
    hashtags: ["#VietnamNationalDay"],
  },
  {
    id: "philippines-independence",
    name: "Philippine Independence Day",
    alsoKnownAs: [],
    countries: ["PH"],
    category: "national",
    date: { kind: "fixed", month: 6, day: 12 },
    publicHolidayIn: ["PH"],
    leadDays: 12,
    summary: "Independence from Spain, 12 June 1898.",
    whyItMatters: "Diaspora content in SG is relevant — large Filipino community.",
    contentHooks: [
      "Community events in Singapore",
      "Food and flag stories",
    ],
    visuals: ["blue red yellow flag", "sun and stars"],
    hashtags: ["#ArawNgKalayaan"],
  },
  {
    id: "us-independence",
    name: "US Independence Day",
    alsoKnownAs: ["Fourth of July"],
    countries: ["US"],
    category: "national",
    date: { kind: "fixed", month: 7, day: 4 },
    publicHolidayIn: ["US"],
    leadDays: 14,
    summary: "American national day: fireworks, BBQ, flags.",
    whyItMatters: "US-audience brands; BBQ and summer party content.",
    contentHooks: ["Grill menus", "Fireworks safety", "Red-white-blue styling"],
    visuals: ["fireworks", "stars and stripes", "BBQ"],
    hashtags: ["#FourthOfJuly", "#IndependenceDay"],
  },
  {
    id: "bastille-day",
    name: "Bastille Day",
    alsoKnownAs: ["Fête nationale"],
    countries: ["FR"],
    category: "national",
    date: { kind: "fixed", month: 7, day: 14 },
    publicHolidayIn: ["FR"],
    leadDays: 10,
    summary: "French national day.",
    whyItMatters: "Paris fireworks and French F&B worldwide.",
    contentHooks: ["Picnic français", "Bastille history in brief"],
    visuals: ["tricolour", "fireworks over the Eiffel Tower"],
    hashtags: ["#BastilleDay", "#14Juillet"],
  },
  {
    id: "australia-day",
    name: "Australia Day",
    alsoKnownAs: [],
    countries: ["AU"],
    category: "national",
    date: { kind: "fixed", month: 1, day: 26 },
    publicHolidayIn: ["AU"],
    leadDays: 14,
    summary:
      "National day, also contested as Invasion Day. Handle with more than BBQ clichés.",
    whyItMatters: "Beach, citizenship ceremonies, and a live public debate — tone matters.",
    contentHooks: [
      "Community events and summer food",
      "Acknowledgement of Country done properly",
    ],
    visuals: ["beaches", "southern cross", "summer light"],
    hashtags: ["#AustraliaDay"],
  },
  {
    id: "anzac-day",
    name: "ANZAC Day",
    alsoKnownAs: [],
    countries: ["AU"],
    category: "national",
    date: { kind: "fixed", month: 4, day: 25 },
    publicHolidayIn: ["AU"],
    leadDays: 10,
    summary: "Remembrance for Australian and New Zealand forces. Dawn services.",
    whyItMatters: "Somber, not commercial. Poppies, dawn, and quiet respect.",
    contentHooks: ["Dawn service explainers", "History without gore-as-content"],
    visuals: ["rosemary", "dawn", "medals"],
    hashtags: ["#ANZACDay"],
  },
  {
    id: "oktoberfest",
    name: "Oktoberfest",
    alsoKnownAs: [],
    countries: ["DE"],
    category: "cultural",
    date: {
      kind: "span-map",
      byYear: {
        2025: { start: "2025-09-20", days: 17 },
        2026: { start: "2026-09-19", days: 17 },
        2027: { start: "2027-09-18", days: 17 },
      },
    },
    publicHolidayIn: [],
    leadDays: 18,
    summary: "Munich beer festival, running from mid-September into October.",
    whyItMatters: "Travel, food, and dirndl/lederhosen. Pop-up Oktoberfests in SG too.",
    contentHooks: [
      "How to do Munich without only the tents",
      "Beer-and-pretzel pairings",
      "SG hotel Oktoberfest pop-ups",
    ],
    visuals: ["beer tents", "pretzels", "autumn wreaths"],
    hashtags: ["#Oktoberfest"],
  },
  {
    id: "day-of-the-dead",
    name: "Día de los Muertos",
    alsoKnownAs: ["Day of the Dead"],
    countries: ["MX"],
    category: "cultural",
    date: { kind: "span-fixed", month: 11, day: 1, days: 2 },
    publicHolidayIn: ["MX"],
    leadDays: 14,
    summary:
      "Mexican days of remembrance, 1–2 November. Ofrendas, marigolds, and sugar skulls — not Halloween.",
    whyItMatters: "Rich visual culture. Credit Mexican origin; don’t flatten into costume content.",
    contentHooks: [
      "How an ofrenda is built",
      "Pan de muerto",
      "Why it is not Halloween",
    ],
    visuals: ["cempasúchil", "papel picado", "sugar skulls"],
    hashtags: ["#DiaDeLosMuertos", "#DayOfTheDead"],
  },
  {
    id: "carnival-rio",
    name: "Rio Carnival",
    alsoKnownAs: ["Carnaval"],
    countries: ["BR"],
    category: "cultural",
    date: {
      kind: "span-map",
      byYear: {
        2025: { start: "2025-03-01", days: 5 },
        2026: { start: "2026-02-14", days: 4 },
        2027: { start: "2027-02-06", days: 4 },
      },
    },
    publicHolidayIn: ["BR"],
    leadDays: 21,
    summary: "Days before Lent. Samba schools, street blocos, and a global costume peak.",
    whyItMatters: "Travel and music content. Tie to the Christian calendar (moves with Easter).",
    contentHooks: [
      "Sambadrome vs street carnival",
      "Costume and sequin stories",
      "Music playlists",
    ],
    visuals: ["feathers", "samba", "night parades"],
    hashtags: ["#Carnaval", "#RioCarnival"],
  },
  {
    id: "womens-day",
    name: "International Women's Day",
    alsoKnownAs: [],
    countries: ["GLOBAL", "SG", "CN", "FR", "US", "GB", "IN", "AU"],
    category: "seasonal",
    date: { kind: "fixed", month: 3, day: 8 },
    publicHolidayIn: [],
    leadDays: 14,
    summary: "Global day for women’s rights and achievements.",
    whyItMatters:
      "Easy to get tokenistic. Specific people, pay, and craft stories beat pink-washed product dumps.",
    contentHooks: [
      "Profiles of women in your field",
      "What still needs to change, locally",
      "IWD vs Mother’s Day — they are not the same",
    ],
    visuals: ["purple and gold", "portraits", "protest and celebration"],
    hashtags: ["#IWD", "#InternationalWomensDay"],
  },
  {
    id: "earth-day",
    name: "Earth Day",
    alsoKnownAs: [],
    countries: ["GLOBAL", "SG", "US"],
    category: "seasonal",
    date: { kind: "fixed", month: 4, day: 22 },
    publicHolidayIn: [],
    leadDays: 10,
    summary: "Environmental action day, 22 April.",
    whyItMatters: "Climate, waste, and nature content. Concrete local actions beat stock greenery.",
    contentHooks: [
      "One-week waste audits",
      "SG parks and shore cleanups",
      "Repair vs replace",
    ],
    visuals: ["green", "coasts", "hands in soil"],
    hashtags: ["#EarthDay"],
  },
  {
    id: "pride-month",
    name: "Pride Month",
    alsoKnownAs: [],
    countries: ["GLOBAL", "US", "GB", "AU", "SG"],
    category: "seasonal",
    date: { kind: "span-fixed", month: 6, day: 1, days: 30 },
    publicHolidayIn: [],
    leadDays: 14,
    summary:
      "June LGBTQ+ Pride in many countries. In Singapore, Pink Dot is typically held in June or around that season.",
    whyItMatters:
      "Community over rainbow-washing. Amplify local groups and be consistent past June.",
    contentHooks: [
      "Local events and history",
      "Creators and businesses to support",
      "How to show up if you are an ally brand",
    ],
    visuals: ["pride flags", "crowds", "night lights"],
    hashtags: ["#Pride", "#PrideMonth"],
  },
  {
    id: "mid-year-618",
    name: "6.18 mid-year sale",
    alsoKnownAs: ["618"],
    countries: ["CN", "GLOBAL"],
    category: "commercial",
    date: { kind: "fixed", month: 6, day: 18 },
    publicHolidayIn: [],
    leadDays: 14,
    summary: "China’s mid-year e-commerce festival, now felt on regional platforms.",
    whyItMatters: "Second shopping peak after 11.11. Wishlist and live-commerce content.",
    contentHooks: ["What 618 is", "Stacking discounts without overbuying"],
    visuals: ["618 numerals", "live-stream setups"],
    hashtags: ["#618"],
  },
  {
    id: "double-twelve",
    name: "12.12 sale",
    alsoKnownAs: ["Double Twelve"],
    countries: ["CN", "SG", "MY", "GLOBAL"],
    category: "commercial",
    date: { kind: "fixed", month: 12, day: 12 },
    publicHolidayIn: [],
    leadDays: 10,
    summary: "Late-year shopping beat between Black Friday and Christmas.",
    whyItMatters: "Last chance gifts; SEA platforms lean in hard.",
    contentHooks: ["Last-mile gift list", "Compare 11.11 vs 12.12 vs BF"],
    visuals: ["12.12 graphics"],
    hashtags: ["#1212"],
  },
  {
    id: "india-republic-day",
    name: "India Republic Day",
    alsoKnownAs: [],
    countries: ["IN"],
    category: "national",
    date: { kind: "fixed", month: 1, day: 26 },
    publicHolidayIn: ["IN"],
    leadDays: 10,
    summary: "Constitution day, 26 January. Delhi parade.",
    whyItMatters: "Patriotic content for India-facing brands.",
    contentHooks: ["Parade highlights", "Tricolour food and fashion, respectfully"],
    visuals: ["tricolour", "Rajpath parade"],
    hashtags: ["#RepublicDay"],
  },
  {
    id: "india-independence",
    name: "India Independence Day",
    alsoKnownAs: [],
    countries: ["IN"],
    category: "national",
    date: { kind: "fixed", month: 8, day: 15 },
    publicHolidayIn: ["IN"],
    leadDays: 14,
    summary: "15 August 1947.",
    whyItMatters: "Flag hoisting, speeches, and diaspora events in SG.",
    contentHooks: ["Community events", "Then-and-now city stories"],
    visuals: ["tricolour", "kite flying"],
    hashtags: ["#IndependenceDayIndia"],
  },
  {
    id: "nowruz",
    name: "Nowruz",
    alsoKnownAs: ["Persian New Year"],
    countries: ["AE", "GLOBAL"],
    category: "cultural",
    date: { kind: "fixed", month: 3, day: 21 },
    publicHolidayIn: [],
    leadDays: 14,
    summary: "Spring new year for Iranian and many Central Asian communities, around the equinox.",
    whyItMatters: "Haft-sin table is a stunning still-life. Growing diaspora audience.",
    contentHooks: ["Haft-sin explained object by object", "Spring cleaning (khooneh tekouni)"],
    visuals: ["haft-sin", "hyacinths", "goldfish bowls"],
    hashtags: ["#Nowruz"],
  },
  {
    id: "halloween-uk-bonfire",
    name: "Guy Fawkes Night",
    alsoKnownAs: ["Bonfire Night"],
    countries: ["GB"],
    category: "cultural",
    date: { kind: "fixed", month: 11, day: 5 },
    publicHolidayIn: [],
    leadDays: 8,
    summary: "UK fireworks and bonfires, 5 November.",
    whyItMatters: "Fireworks, toffee apples, and a history beat distinct from Halloween.",
    contentHooks: ["Fireworks displays", "Parkin and toffee apples"],
    visuals: ["bonfires", "fireworks", "night parks"],
    hashtags: ["#BonfireNight", "#GuyFawkes"],
  },
  {
    id: "boxing-day",
    name: "Boxing Day",
    alsoKnownAs: [],
    countries: ["GB", "AU", "SG", "MY"],
    category: "seasonal",
    date: { kind: "fixed", month: 12, day: 26 },
    publicHolidayIn: ["GB", "AU"],
    leadDays: 5,
    summary: "Day after Christmas. Sales in the UK/Australia; leftover energy everywhere.",
    whyItMatters: "Sales content and leftover recipes. Not a holiday in Singapore.",
    contentHooks: ["Leftover makeovers", "UK/AU sale trackers"],
    visuals: ["boxes and ribbons", "sales rails"],
    hashtags: ["#BoxingDay"],
  },
];

const EASTER_BY_YEAR = EASTER;

function pad(n) {
  return String(n).padStart(2, "0");
}

export function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function nthWeekday(year, month, weekday, n) {
  const first = new Date(year, month - 1, 1);
  const delta = (weekday - first.getDay() + 7) % 7;
  const day = 1 + delta + (n - 1) * 7;
  return new Date(year, month - 1, day);
}

function resolveStart(dateRule, year) {
  switch (dateRule.kind) {
    case "fixed":
      return new Date(year, dateRule.month - 1, dateRule.day);
    case "map":
      return dateRule.byYear[year] ? fromISODate(dateRule.byYear[year]) : null;
    case "span-map": {
      const span = dateRule.byYear[year];
      return span ? fromISODate(span.start) : null;
    }
    case "span-fixed":
      return new Date(year, dateRule.month - 1, dateRule.day);
    case "nth-weekday": {
      const base = nthWeekday(year, dateRule.month, dateRule.weekday, dateRule.n);
      return dateRule.offsetDays ? addDays(base, dateRule.offsetDays) : base;
    }
    case "easter": {
      const easter = EASTER_BY_YEAR[year];
      if (!easter) return null;
      return addDays(fromISODate(easter), dateRule.offset);
    }
    default:
      return null;
  }
}

function resolveDuration(dateRule, year) {
  if (dateRule.kind === "span-map") {
    return dateRule.byYear[year]?.days ?? 1;
  }
  if (dateRule.kind === "span-fixed") {
    return dateRule.days ?? 1;
  }
  return 1;
}

export function occurrencesForYear(festival, year) {
  const start = resolveStart(festival.date, year);
  if (!start || start.getFullYear() !== year) return [];
  const days = resolveDuration(festival.date, year);
  const dates = [];
  for (let i = 0; i < days; i += 1) {
    dates.push(toISODate(addDays(start, i)));
  }
  return [
    {
      festival,
      year,
      startISO: dates[0],
      endISO: dates[dates.length - 1],
      dates,
      days,
    },
  ];
}

export function allOccurrences(year) {
  return FESTIVALS.flatMap((festival) => occurrencesForYear(festival, year));
}

export function countryByCode(code) {
  return COUNTRIES.find((country) => country.code === code);
}

export function categoryById(id) {
  return CATEGORIES.find((category) => category.id === id);
}
