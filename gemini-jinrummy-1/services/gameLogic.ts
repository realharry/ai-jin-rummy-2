import { SUITS, RANKS, RANK_VALUES } from '../constants';
import type { Card, GameState, Meld } from '../types';
import { GamePhase, GameStatus } from '../types';

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, value: RANK_VALUES[rank] });
    }
  }
  return deck;
}

function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: Card[]): { playerHand: Card[], aiHand: Card[], remainingDeck: Card[] } {
  const playerHand = deck.slice(0, 10);
  const aiHand = deck.slice(10, 20);
  const remainingDeck = deck.slice(20);
  return { playerHand, aiHand, remainingDeck };
}

export function createInitialGameState(): GameState {
  const shuffledDeck = shuffleDeck(createDeck());
  const { playerHand, aiHand, remainingDeck } = dealCards(shuffledDeck);
  const discardPile = [remainingDeck.pop()!];

  return {
    deck: remainingDeck,
    playerHand,
    aiHand,
    discardPile,
    turn: 'player',
    phase: GamePhase.DRAW,
    status: GameStatus.PLAYING,
    winner: null,
    loadingMessage: null,
    playerScore: 0,
    aiScore: 0,
  };
}

export function prepareNextRoundState(currentState: GameState): GameState {
    const shuffledDeck = shuffleDeck(createDeck());
    const { playerHand, aiHand, remainingDeck } = dealCards(shuffledDeck);
    const discardPile = [remainingDeck.pop()!];

    // Winner of the round plays first in the next round.
    const nextTurn = currentState.winner === 'player' ? 'player' : 'ai';

    return {
        ...currentState, // keeps scores
        deck: remainingDeck,
        playerHand,
        aiHand,
        discardPile,
        turn: nextTurn,
        phase: GamePhase.DRAW,
        status: GameStatus.PLAYING,
        winner: null,
        loadingMessage: null,
    };
}


const getRankIndex = (rank: string) => RANKS.indexOf(rank as any);

export function sortHand(hand: Card[]): Card[] {
  if (hand.length === 0) return [];

  return [...hand].sort((a, b) => {
    // First, sort by suit using the order defined in constants
    const suitComparison = SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
    if (suitComparison !== 0) {
      return suitComparison;
    }
    // If suits are the same, sort by rank (Ace low)
    return getRankIndex(a.rank) - getRankIndex(b.rank);
  });
}

export function findMelds(hand: Card[]): { melds: Meld[], remainingCards: Card[] } {
    let cards = [...hand].sort((a, b) => getRankIndex(a.rank) - getRankIndex(b.rank));
    const melds: Meld[] = [];
    let meldedCards = new Set<string>();

    // Find sets
    const ranks: { [key: string]: Card[] } = {};
    cards.forEach(card => {
        if (!ranks[card.rank]) ranks[card.rank] = [];
        ranks[card.rank].push(card);
    });

    for (const rank in ranks) {
        if (ranks[rank].length >= 3) {
            melds.push({ type: 'set', cards: ranks[rank] });
            ranks[rank].forEach(c => meldedCards.add(`${c.rank}-${c.suit}`));
        }
    }
    
    let unmelded = cards.filter(c => !meldedCards.has(`${c.rank}-${c.suit}`));
    
    // Find runs
    const suits: { [key: string]: Card[] } = {};
     unmelded.forEach(card => {
        if (!suits[card.suit]) suits[card.suit] = [];
        suits[card.suit].push(card);
    });

    for (const suit in suits) {
        const suitCards = suits[suit];
        if (suitCards.length < 3) continue;

        for (let i = 0; i <= suitCards.length - 3; i++) {
            let potentialRun = [suitCards[i]];
            let lastCard = suitCards[i];
            for (let j = i + 1; j < suitCards.length; j++) {
                if (getRankIndex(suitCards[j].rank) === getRankIndex(lastCard.rank) + 1) {
                    potentialRun.push(suitCards[j]);
                    lastCard = suitCards[j];
                }
            }
            if (potentialRun.length >= 3) {
                melds.push({ type: 'run', cards: potentialRun });
                potentialRun.forEach(c => meldedCards.add(`${c.rank}-${c.suit}`));
                // Basic implementation: does not handle overlapping runs optimally
                i += potentialRun.length - 1;
            }
        }
    }

    const remainingCards = cards.filter(c => !meldedCards.has(`${c.rank}-${c.suit}`));
    return { melds, remainingCards };
}

export function getDeadwood(hand: Card[]): { total: number, cards: Card[] } {
    const { remainingCards } = findMelds(hand);
    const total = remainingCards.reduce((sum, card) => sum + card.value, 0);
    return { total, cards: remainingCards };
}

export function checkForGin(hand: Card[]): boolean {
    return getDeadwood(hand).total === 0;
}
