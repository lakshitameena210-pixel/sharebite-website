import { GoogleGenAI, Type } from '@google/genai';
import { FoodCategory, RescuePriority } from '../types';

export interface AISuggestionResponse {
  title: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  estimatedServings: number;
  description: string;
  rescuePriority: RescuePriority;
  dietaryTags: string[];
  recommendedExpiryHours: number;
  storageInstructions: string;
  pickupTimeWindow: string;
}

// Fallback rule-based parsing engine for Indian surplus food items
function fallbackHeuristicExtractor(prompt: string): AISuggestionResponse {
  const lower = prompt.toLowerCase();

  // Category determination
  let category: FoodCategory = 'Prepared Meals';
  if (lower.includes('roti') || lower.includes('naan') || lower.includes('chapati') || lower.includes('paratha') || lower.includes('bread') || lower.includes('croissant') || lower.includes('pav') && !lower.includes('bhaji')) {
    category = 'Bakery & Pastries';
  } else if (lower.includes('samosa') || lower.includes('pakoda') || lower.includes('kachori') || lower.includes('snack') || lower.includes('vada') && !lower.includes('sambar')) {
    category = 'Snacks & Packaged';
  } else if (lower.includes('fruit') || lower.includes('mango') || lower.includes('banana') || lower.includes('sabzi raw') || lower.includes('vegetable raw')) {
    category = 'Fresh Produce';
  } else if (lower.includes('paneer') && !lower.includes('curry') && !lower.includes('masala') || lower.includes('dahi') || lower.includes('curd') || lower.includes('milk')) {
    category = 'Dairy & Eggs';
  } else if (lower.includes('chai') || lower.includes('tea') || lower.includes('lassi') || lower.includes('juice') || lower.includes('nimbu pani') || lower.includes('buttermilk')) {
    category = 'Beverages';
  } else if (lower.includes('atta') || lower.includes('dal raw') || lower.includes('rice raw') || lower.includes('grain')) {
    category = 'Pantry & Dry Goods';
  }

  // Quantity extraction
  let quantity = 15;
  let unit = 'plates';
  const qtyMatch = prompt.match(/(\d+)\s*(plates|thalis|dabbas|boxes|servings|portions|containers|meals|kg|chapatis|rotis|samosas|idlis|packets)?/i);
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1], 10);
    if (qtyMatch[2]) {
      unit = qtyMatch[2].toLowerCase();
    }
  }

  // Dietary tags in Indian context
  const tags: string[] = [];
  if (lower.includes('jain')) {
    tags.push('Jain Friendly', 'Pure Veg');
  } else if (lower.includes('no onion') || lower.includes('no garlic')) {
    tags.push('No Onion / Garlic', 'Pure Veg');
  } else if (lower.includes('chicken') || lower.includes('mutton') || lower.includes('fish') || lower.includes('egg') && !lower.includes('eggless')) {
    tags.push('Non-Veg', 'Halal Friendly');
  } else {
    tags.push('Pure Veg');
  }

  if (lower.includes('gluten-free')) tags.push('Gluten-Free Friendly');

  // Priority
  let rescuePriority: RescuePriority = 'High';
  let recommendedExpiryHours = 4;
  if (category === 'Prepared Meals') {
    rescuePriority = 'Urgent';
    recommendedExpiryHours = 3.5;
  } else if (category === 'Snacks & Packaged') {
    rescuePriority = 'High';
    recommendedExpiryHours = 6;
  } else if (category === 'Pantry & Dry Goods' || category === 'Fresh Produce') {
    rescuePriority = 'Normal';
    recommendedExpiryHours = 24;
  }

  // Title generation
  let title = 'Fresh Surplus Food';
  if (lower.includes('biryani')) {
    title = 'Dum Vegetable Biryani & Raita Handis';
  } else if (lower.includes('dal') && lower.includes('rice')) {
    title = 'Dal Tadka & Steamed Jeera Rice Platters';
  } else if (lower.includes('rajma')) {
    title = 'Dilli Style Rajma Chawal Bowls';
  } else if (lower.includes('pav bhaji')) {
    title = 'Mumbai Pav Bhaji with Butter Ladi Pav';
  } else if (lower.includes('idli') || lower.includes('sambar')) {
    title = 'Steamed Idli, Medu Vada & Piping Sambar';
  } else if (lower.includes('poha')) {
    title = 'Indori Kanda Poha & Sev Breakfast Trays';
  } else if (lower.includes('samosa')) {
    title = 'Crispy Punjabi Samosas & Mint Chutney';
  } else if (lower.includes('paneer')) {
    title = 'Paneer Butter Masala & Phulkas';
  } else if (lower.includes('thali')) {
    title = 'Mixed North Indian Vegetable Thalis';
  } else if (prompt.trim().length > 5) {
    title = prompt.slice(0, 55).trim();
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return {
    title,
    category,
    quantity,
    unit,
    estimatedServings: Math.round(quantity * 1.1),
    description: `Freshly prepared Indian surplus meal: ${prompt.trim()}. Cooked under clean hygienic kitchen conditions and packed in food-grade steel handis or meal boxes. Ready for immediate distribution.`,
    rescuePriority,
    dietaryTags: tags,
    recommendedExpiryHours,
    storageInstructions: category === 'Prepared Meals' ? 'Keep covered in hot cases above 60°C or chill below 4°C upon pickup.' : 'Store in a clean, cool, dry place.',
    pickupTimeWindow: 'Available for immediate pickup today within the next 3 to 4 hours',
  };
}

export class AIService {
  private client: GoogleGenAI | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      try {
        this.client = new GoogleGenAI();
      } catch (err) {
        console.warn('Failed to initialize GoogleGenAI client:', err);
      }
    }
  }

  async suggestListing(donorInput: string): Promise<AISuggestionResponse> {
    if (!this.client || !process.env.GEMINI_API_KEY) {
      return fallbackHeuristicExtractor(donorInput);
    }

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are the ShareBite AI Indian Food Rescue Assistant operating in Jaipur and Indian metropolitan areas.
A food donor (restaurant, wedding caterer, cloud kitchen, or event organizer) entered this surplus food description:
"${donorInput}"

Analyze the surplus food in the context of Indian cuisine (e.g. Vegetable Biryani, Dal Tadka & Rice, Rajma Chawal, Roti & Sabzi, Poha, Idli & Sambar, Pav Bhaji, Veg Pulao, Samosa, Fresh Fruits, Chapati & Dal, Paneer Curry, Lemon Rice, Curd Rice, Mixed Vegetable Thali).

Valid categories are strictly:
"Prepared Meals", "Bakery & Pastries", "Fresh Produce", "Dairy & Eggs", "Pantry & Dry Goods", "Beverages", "Snacks & Packaged".

Valid rescuePriority:
"Urgent" (cooked hot meals/curries needing consumption in under 4 hours), "High" (fresh bakes/evening snacks like samosas good for today), "Normal" (shelf-stable, produce, or items good for 24+ hours).

Dietary tags could include: "Pure Veg", "Jain Friendly", "No Onion / Garlic", "Halal Friendly", "Contains Dairy", "Eggless", "Gluten-Free Friendly".

Quantities should use common Indian units (plates, thalis, dabbas, kg, meals, boxes, portions, chapatis, pieces).`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Clear, enticing title (e.g. "Dum Vegetable Biryani & Cucumber Raita Handis")',
              },
              category: {
                type: Type.STRING,
                description: 'One of the exact valid food categories',
              },
              quantity: {
                type: Type.INTEGER,
                description: 'Numeric quantity of items/servings',
              },
              unit: {
                type: Type.STRING,
                description: 'Unit of measurement (e.g. plates, thalis, dabbas, kg, meals, boxes)',
              },
              estimatedServings: {
                type: Type.INTEGER,
                description: 'Estimated number of individuals this can feed',
              },
              description: {
                type: Type.STRING,
                description: 'Appealing food description noting preparation, hygiene, packaging, and ingredients',
              },
              rescuePriority: {
                type: Type.STRING,
                description: 'Urgent, High, or Normal',
              },
              dietaryTags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Identified dietary traits (e.g. Pure Veg, Jain Friendly, etc.)',
              },
              recommendedExpiryHours: {
                type: Type.NUMBER,
                description: 'Recommended safe hours until expiry (e.g. 3.5 for hot dal/rice, 6 for samosas, 24 for fruits)',
              },
              storageInstructions: {
                type: Type.STRING,
                description: 'Food safety and temperature guidance',
              },
              pickupTimeWindow: {
                type: Type.STRING,
                description: 'Suggested practical pickup window for the recipient in IST',
              },
            },
            required: [
              'title',
              'category',
              'quantity',
              'unit',
              'estimatedServings',
              'description',
              'rescuePriority',
              'dietaryTags',
              'recommendedExpiryHours',
              'storageInstructions',
              'pickupTimeWindow',
            ],
          },
        },
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text) as AISuggestionResponse;
        return parsed;
      }
    } catch (err) {
      console.error('Error generating AI suggestion via Gemini, using smart fallback:', err);
    }

    return fallbackHeuristicExtractor(donorInput);
  }
}

export const aiService = new AIService();
