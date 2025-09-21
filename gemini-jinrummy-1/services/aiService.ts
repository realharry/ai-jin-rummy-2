
import { GoogleGenAI, Type } from "@google/genai";
import type { Card } from '../types';

// This assumes process.env.API_KEY is set in the environment
// In a Vite app, this would be import.meta.env.VITE_API_KEY
const API_KEY = (process.env.API_KEY as string) || '';
const ai = new GoogleGenAI({ apiKey: API_KEY });

const model = 'gemini-2.5-flash';

function handToString(hand: Card[]): string {
  return hand.map(c => `${c.rank} of ${c.suit}`).join(', ');
}

interface AIDecision {
  drawFromDiscard: boolean;
  cardToDiscard: Card | null;
}

export const getAIDecision = async (hand: Card[], topDiscard: Card | null): Promise<AIDecision> => {
  if (!API_KEY) {
    console.error("API_KEY not found.");
    // Fallback simple logic
    return { drawFromDiscard: false, cardToDiscard: hand[hand.length - 1] };
  }

  try {
    if (hand.length === 10 && topDiscard) {
      // Decision 1: Draw or not
      const prompt = `You are a Jin Rummy AI. Your hand is: ${handToString(hand)}. The top card of the discard pile is ${topDiscard.rank} of ${topDiscard.suit}. Would taking this card help you form melds (sets or runs) or reduce your deadwood score? Respond in JSON format.`;
      
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    shouldTake: {
                        type: Type.BOOLEAN,
                        description: "True if taking the discard card is beneficial."
                    }
                }
            }
        }
      });
      
      const decisionJson = JSON.parse(response.text);
      return { drawFromDiscard: decisionJson.shouldTake, cardToDiscard: null };

    } else if (hand.length === 11) {
      // Decision 2: Discard
      const prompt = `You are a Jin Rummy AI. Your hand is: ${handToString(hand)}. You must discard one card. Choose the card that is least likely to help you form a meld (set or run) and has the highest point value if it's deadwood. Respond in JSON format with the rank and suit of the card to discard.`;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    rank: { type: Type.STRING, description: "Rank of card, e.g., 'A', '10', 'K'" },
                    suit: { type: Type.STRING, description: "Suit of card, e.g., 'hearts', 'spades'" }
                }
            }
        }
      });
      
      const discardJson = JSON.parse(response.text);
      const cardToDiscard = hand.find(c => c.rank === discardJson.rank && c.suit === discardJson.suit);
      
      return { drawFromDiscard: false, cardToDiscard: cardToDiscard || hand[hand.length - 1] }; // Failsafe
    }
  } catch (error) {
    console.error("Error with Gemini API:", error);
    // Fallback logic on API error
    if (hand.length === 11) {
        // Discard highest value card
        const sortedHand = [...hand].sort((a,b) => b.value - a.value);
        return { drawFromDiscard: false, cardToDiscard: sortedHand[0] };
    }
    return { drawFromDiscard: false, cardToDiscard: null };
  }
  
  // Default fallback
  return { drawFromDiscard: false, cardToDiscard: hand.length > 10 ? hand[0] : null };
};
