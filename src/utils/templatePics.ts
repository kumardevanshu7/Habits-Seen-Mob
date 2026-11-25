// Explicit direct imports for all 29 curated template pictures
// This guarantees 100% build reliability on all platforms (Windows, Linux, Vercel, PWA, Android APK)
import imgAfghaniChaap from '../template-pics/Cartoon Afghani Chaap Platter.webp';
import imgBurger from '../template-pics/Cartoon Burger Sticker Icon.webp';
import imgCholeBhature from '../template-pics/Cartoon Chole Bhature Plate.webp';
import imgDosa from '../template-pics/Cartoon Dosa Thali with Chutneys.webp';
import imgChowMein from '../template-pics/Chopsticks Lifting Savory Chow Mein.webp';
import imgVadaPav from '../template-pics/Classic Vada Pav Plate.webp';
import imgSoda from '../template-pics/Colorful Soda Can and Glass Collection.webp';
import imgMalaiChaap from '../template-pics/Creamy Malai Chaap Platter.webp';
import imgPasta from '../template-pics/Creamy Mushroom Penne with Herbs.webp';
import imgRumaliRoti from '../template-pics/Flaky Romali Roti with Onion Garnish.webp';
import imgFreeFire from '../template-pics/Free Fire Battle Emblem.webp';
import imgAdult18 from '../template-pics/Glossy 18+ Restriction Badge.webp';
import imgChilliPotato from '../template-pics/Glossy Chilli Potato Plate.webp';
import imgChocolateBar from '../template-pics/Glossy Chocolate Bar Stack with Green Leaves.webp';
import imgChocolateCake from '../template-pics/Glossy Chocolate Cake Slice on Plate.webp';
import imgSpermSwarm from '../template-pics/Glossy Sperm Swarm Illustration.webp';
import imgMcPuff from '../template-pics/Golden McPuff with Savory Filling.webp';
import imgSamosa from '../template-pics/Golden Samosas with Green Chutney.webp';
import imgLavaCake from '../template-pics/Molten Chocolate Lava Cake Delight.webp';
import imgNoLust from '../template-pics/No Lust Lips Sticker.webp';
import imgNoMoneyLoan from '../template-pics/No Money Loan Icon.webp';
import imgNoSnapRequest from '../template-pics/No Snap Send Request.webp';
import imgPaneerWrap from '../template-pics/Paneer Wraps with Green Chutney.webp';
import imgNailClipper from '../template-pics/Shiny Stainless Steel Nail Clipper.webp';
import imgRoti from '../template-pics/Stacked Rotis with Cilantro Garnish.webp';
import imgSteamedMomos from '../template-pics/Steamed Momos with Spicy Chutney.webp';
import imgChai from '../template-pics/Steaming Chai with Spices and Ginger.webp';
import imgCoffee from '../template-pics/Steaming Latte with Coffee Beans.webp';
import imgTandooriMomos from '../template-pics/Tandoori Momos with Chutneys and Paneer.webp';

export type TemplatePicCategoryId =
  | 'fast-food'
  | 'drinks'
  | 'sweets'
  | 'meals'
  | 'timepass'
  | 'self-control';

export interface TemplatePicCategoryMeta {
  id: TemplatePicCategoryId;
  label: string;
  shortLabel: string;
  emoji: string;
}

export const TEMPLATE_PIC_CATEGORIES: TemplatePicCategoryMeta[] = [
  { id: 'fast-food', label: 'Fast Food & Street', shortLabel: 'Fast Food', emoji: '🍔' },
  { id: 'drinks', label: 'Cold Drinks & Chai', shortLabel: 'Cold Drinks', emoji: '🥤' },
  { id: 'sweets', label: 'Sweets & Chocolate', shortLabel: 'Sweets', emoji: '🍫' },
  { id: 'meals', label: 'Meals & Roti', shortLabel: 'Meals', emoji: '🫓' },
  { id: 'timepass', label: 'Timepass & Lifestyle', shortLabel: 'Timepass', emoji: '🎮' },
  { id: 'self-control', label: 'Self-Control (18+)', shortLabel: '18+ Control', emoji: '🔞' },
];

export interface TemplatePic {
  id: string; // filename identifier e.g. "Creamy Malai Chaap Platter.webp"
  name: string; // short clean display name e.g. "Malai Chaap"
  fullName: string; // full original filename without extension
  url: string; // resolved Vite asset URL
  filename: string;
  category: TemplatePicCategoryId;
  keywords: string[];
}

interface StaticTemplateSeed {
  filename: string;
  name: string;
  url: string;
  category: TemplatePicCategoryId;
  keywords: string[];
}

const STATIC_TEMPLATE_SEEDS: StaticTemplateSeed[] = [
  // 1. Fast Food & Street
  {
    filename: 'Cartoon Burger Sticker Icon.webp',
    name: 'Burger',
    url: imgBurger,
    category: 'fast-food',
    keywords: ['burger', 'fast food', 'junk', 'mcdonalds', 'fries', 'cheat meal'],
  },
  {
    filename: 'Creamy Mushroom Penne with Herbs.webp',
    name: 'Pasta / Penne',
    url: imgPasta,
    category: 'fast-food',
    keywords: ['pasta', 'penne', 'white sauce', 'mushroom', 'macaroni', 'fast food', 'junk'],
  },
  {
    filename: 'Chopsticks Lifting Savory Chow Mein.webp',
    name: 'Chow Mein',
    url: imgChowMein,
    category: 'fast-food',
    keywords: ['chow mein', 'noodles', 'hakka', 'chinese', 'street food', 'fast food'],
  },
  {
    filename: 'Steamed Momos with Spicy Chutney.webp',
    name: 'Steamed Momos',
    url: imgSteamedMomos,
    category: 'fast-food',
    keywords: ['momos', 'dumplings', 'steamed', 'street food', 'fast food'],
  },
  {
    filename: 'Tandoori Momos with Chutneys and Paneer.webp',
    name: 'Tandoori Momos',
    url: imgTandooriMomos,
    category: 'fast-food',
    keywords: ['tandoori momos', 'momos', 'street food', 'fast food', 'fried'],
  },
  {
    filename: 'Glossy Chilli Potato Plate.webp',
    name: 'Chilli Potato',
    url: imgChilliPotato,
    category: 'fast-food',
    keywords: ['chilli potato', 'honey chilli', 'fries', 'street food', 'fast food'],
  },
  {
    filename: 'Golden McPuff with Savory Filling.webp',
    name: 'Pizza McPuff',
    url: imgMcPuff,
    category: 'fast-food',
    keywords: ['mcpuff', 'pizza', 'puff', 'fast food', 'bakery', 'fried'],
  },
  {
    filename: 'Golden Samosas with Green Chutney.webp',
    name: 'Samosa',
    url: imgSamosa,
    category: 'fast-food',
    keywords: ['samosa', 'fried', 'oily', 'snack', 'street food', 'fast food'],
  },
  {
    filename: 'Classic Vada Pav Plate.webp',
    name: 'Vada Pav',
    url: imgVadaPav,
    category: 'fast-food',
    keywords: ['vada pav', 'street food', 'fried', 'snack', 'fast food'],
  },
  {
    filename: 'Paneer Wraps with Green Chutney.webp',
    name: 'Paneer Wrap',
    url: imgPaneerWrap,
    category: 'fast-food',
    keywords: ['wrap', 'roll', 'kathi roll', 'paneer', 'fast food', 'street food'],
  },
  {
    filename: 'Creamy Malai Chaap Platter.webp',
    name: 'Malai Chaap',
    url: imgMalaiChaap,
    category: 'fast-food',
    keywords: ['malai chaap', 'chaap', 'creamy', 'street food', 'fast food'],
  },
  {
    filename: 'Cartoon Afghani Chaap Platter.webp',
    name: 'Afghani Chaap',
    url: imgAfghaniChaap,
    category: 'fast-food',
    keywords: ['afghani chaap', 'chaap', 'street food', 'fast food'],
  },

  // 2. Cold Drinks & Chai
  {
    filename: 'Colorful Soda Can and Glass Collection.webp',
    name: 'Soda & Cold Drinks',
    url: imgSoda,
    category: 'drinks',
    keywords: ['soda', 'cold drink', 'coldrink', 'cola', 'coke', 'pepsi', 'soft drink', 'sugar'],
  },
  {
    filename: 'Steaming Chai with Spices and Ginger.webp',
    name: 'Chai / Tea',
    url: imgChai,
    category: 'drinks',
    keywords: ['chai', 'tea', 'caffeine', 'drink', 'beverage', 'sugar'],
  },
  {
    filename: 'Steaming Latte with Coffee Beans.webp',
    name: 'Coffee / Latte',
    url: imgCoffee,
    category: 'drinks',
    keywords: ['coffee', 'latte', 'caffeine', 'espresso', 'drink', 'beverage'],
  },

  // 3. Sweets & Chocolate
  {
    filename: 'Glossy Chocolate Bar Stack with Green Leaves.webp',
    name: 'Chocolate',
    url: imgChocolateBar,
    category: 'sweets',
    keywords: ['chocolate', 'bar', 'cadbury', 'sweet', 'sugar', 'candy', 'dessert'],
  },
  {
    filename: 'Glossy Chocolate Cake Slice on Plate.webp',
    name: 'Pastry & Cake',
    url: imgChocolateCake,
    category: 'sweets',
    keywords: ['cake', 'pastry', 'bakery', 'sweet', 'sugar', 'dessert'],
  },
  {
    filename: 'Molten Chocolate Lava Cake Delight.webp',
    name: 'Choco Lava Cake',
    url: imgLavaCake,
    category: 'sweets',
    keywords: ['lava cake', 'chocolate', 'cake', 'dessert', 'sweet', 'sugar'],
  },

  // 4. Meals & Roti
  {
    filename: 'Cartoon Chole Bhature Plate.webp',
    name: 'Chole Bhature',
    url: imgCholeBhature,
    category: 'meals',
    keywords: ['chole bhature', 'bhature', 'heavy meal', 'oily', 'lunch', 'cheat meal'],
  },
  {
    filename: 'Cartoon Dosa Thali with Chutneys.webp',
    name: 'Dosa',
    url: imgDosa,
    category: 'meals',
    keywords: ['dosa', 'south indian', 'thali', 'meal', 'breakfast'],
  },
  {
    filename: 'Flaky Romali Roti with Onion Garnish.webp',
    name: 'Rumali Roti',
    url: imgRumaliRoti,
    category: 'meals',
    keywords: ['rumali roti', 'roti', 'maida', 'bread', 'carbs', 'meal'],
  },
  {
    filename: 'Stacked Rotis with Cilantro Garnish.webp',
    name: 'Roti / Chapati',
    url: imgRoti,
    category: 'meals',
    keywords: ['roti', 'chapati', 'wheat', 'gluten', 'carbs', 'meal'],
  },

  // 5. Timepass & Lifestyle
  {
    filename: 'Free Fire Battle Emblem.webp',
    name: 'Free Fire',
    url: imgFreeFire,
    category: 'timepass',
    keywords: ['free fire', 'gaming', 'game', 'timepass', 'mobile', 'screen time'],
  },
  {
    filename: 'No Snap Send Request.webp',
    name: 'No Snap Request',
    url: imgNoSnapRequest,
    category: 'timepass',
    keywords: ['snap', 'snapchat', 'send request', 'friend request', 'social media', 'timepass'],
  },
  {
    filename: 'Shiny Stainless Steel Nail Clipper.webp',
    name: 'Nail Biting',
    url: imgNailClipper,
    category: 'timepass',
    keywords: ['nail', 'nail biting', 'nail cutter', 'clipper', 'nakhun', 'timepass', 'habit'],
  },
  {
    filename: 'No Money Loan Icon.webp',
    name: 'No Money Loan',
    url: imgNoMoneyLoan,
    category: 'timepass',
    keywords: ['money', 'loan', 'udhar', 'borrow', 'lend', 'debt', 'spending', 'finance', 'lifestyle'],
  },

  // 6. Self-Control (18+)
  {
    filename: 'Glossy 18+ Restriction Badge.webp',
    name: '18+ Adult Content',
    url: imgAdult18,
    category: 'self-control',
    keywords: ['18+', 'adult', 'porn', 'nsfw', 'self control', 'nofap'],
  },
  {
    filename: 'Glossy Sperm Swarm Illustration.webp',
    name: 'NoFap / Masturbation',
    url: imgSpermSwarm,
    category: 'self-control',
    keywords: ['nofap', 'masturbation', 'semen retention', '18+', 'self control', 'urge'],
  },
  {
    filename: 'No Lust Lips Sticker.webp',
    name: 'No Lust / Control',
    url: imgNoLust,
    category: 'self-control',
    keywords: ['no lust', 'lust', 'urges', 'self control', 'brahmacharya', '18+'],
  },
];

const SHORT_NAME_MAP: Record<string, string> = Object.fromEntries(
  STATIC_TEMPLATE_SEEDS.map((seed) => [seed.filename.replace(/\.[^/.]+$/, '').trim(), seed.name])
);

const STATIC_TEMPLATE_PICS: TemplatePic[] = STATIC_TEMPLATE_SEEDS.map((seed) => ({
  id: seed.filename,
  filename: seed.filename,
  fullName: seed.filename.replace(/\.[^/.]+$/, '').trim(),
  name: seed.name,
  url: seed.url,
  category: seed.category,
  keywords: seed.keywords,
}));

/**
 * Infers a clear category for any future dynamically added template image.
 */
export function inferTemplateCategory(rawName: string): TemplatePicCategoryId {
  const lower = rawName.toLowerCase();
  if (/(soda|cola|coke|pepsi|drink|juice|chai|tea|coffee|latte|shake)/.test(lower)) {
    return 'drinks';
  }
  if (/(chocolate|cake|pastry|sweet|candy|cookie|ice cream|dessert|donut|mithai)/.test(lower)) {
    return 'sweets';
  }
  if (/(roti|chapati|thali|dosa|bhature|rice|meal|paratha)/.test(lower)) {
    return 'meals';
  }
  if (/(18\+|lust|sperm|nofap|porn|adult)/.test(lower)) {
    return 'self-control';
  }
  if (/(game|fire|snap|insta|reel|youtube|nail|clipper|money|loan|phone|timepass|smoking)/.test(lower)) {
    return 'timepass';
  }
  return 'fast-food';
}

/**
 * Returns a short, clean, human-friendly title for any template image.
 */
export function getShortTemplateName(rawName: string): string {
  const trimmed = rawName.trim();
  if (SHORT_NAME_MAP[trimmed]) {
    return SHORT_NAME_MAP[trimmed];
  }

  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(SHORT_NAME_MAP)) {
    if (key.toLowerCase() === lower) return val;
  }

  const clean = trimmed
    .replace(/^(Cartoon|Glossy|Golden|Classic|Flaky|Creamy|Steamed|Crispy|Shiny)\s+/i, '')
    .replace(/\s+(Platter|Plate|Sticker Icon|Sticker|Icon|Collection|Illustration|Badge|Emblem|with [^,]+)$/i, '')
    .trim();

  return clean || trimmed;
}

// Vite's import.meta.glob dynamically imports all images from src/template-pics/
// so any newly added image dropped into the folder is also loaded automatically.
const dynamicImageModules = import.meta.glob<{ default: string }>(
  '../template-pics/*.{png,jpg,jpeg,webp,svg,PNG,JPG,JPEG,WEBP,SVG}',
  { eager: true }
);

export function getTemplatePicList(): TemplatePic[] {
  const list: TemplatePic[] = [...STATIC_TEMPLATE_PICS];
  const seenIds = new Set<string>(STATIC_TEMPLATE_PICS.map((item) => item.id.toLowerCase()));

  for (const [path, mod] of Object.entries(dynamicImageModules)) {
    const filename = path.split('/').pop() || '';
    if (!filename || seenIds.has(filename.toLowerCase())) continue;
    seenIds.add(filename.toLowerCase());

    const fullName = filename.replace(/\.[^/.]+$/, '').trim();
    const shortName = getShortTemplateName(fullName);
    const url = mod?.default || (typeof mod === 'string' ? mod : '');

    list.push({
      id: filename,
      name: shortName,
      fullName,
      url,
      filename,
      category: inferTemplateCategory(fullName),
      keywords: fullName.toLowerCase().split(/\s+/),
    });
  }

  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export function getTemplateCategoryMeta(categoryId: TemplatePicCategoryId): TemplatePicCategoryMeta {
  return (
    TEMPLATE_PIC_CATEGORIES.find((cat) => cat.id === categoryId) || TEMPLATE_PIC_CATEGORIES[0]
  );
}

/**
 * Returns the resolved asset URL for a given template picture filename or id.
 */
export function getTemplatePicUrl(imageIdentifier?: string): string | undefined {
  if (!imageIdentifier) return undefined;

  const list = getTemplatePicList();
  const lower = imageIdentifier.toLowerCase();

  const match = list.find(
    (item) =>
      item.id.toLowerCase() === lower ||
      item.filename.toLowerCase() === lower ||
      item.name.toLowerCase() === lower ||
      item.fullName.toLowerCase() === lower
  );
  if (match) return match.url;

  if (
    imageIdentifier.startsWith('http://') ||
    imageIdentifier.startsWith('https://') ||
    imageIdentifier.startsWith('data:') ||
    imageIdentifier.startsWith('/')
  ) {
    return imageIdentifier;
  }

  return undefined;
}

// Backward-compatibility aliases for templateJunks
export type TemplateJunk = TemplatePic;
export const getTemplateJunkList = getTemplatePicList;
export const getTemplateJunkUrl = getTemplatePicUrl;
