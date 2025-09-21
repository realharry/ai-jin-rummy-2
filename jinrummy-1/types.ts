export enum Suit {
  Hearts = 'hearts',
  Diamonds = 'diamonds',
  Clubs = 'clubs',
  Spades = 'spades',
}

export enum Rank {
  Ace = 'A',
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = '10',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
}

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

export type Player = 'player' | 'ai';
export type Turn = Player;

export enum GamePhase {
  DRAW = 'draw',
  DISCARD = 'discard',
}

export enum GameStatus {
    PLAYING = 'playing',
    ROUND_OVER = 'round_over',
    FINISHED = 'finished'
}

export interface GameState {
  deck: Card[];
  playerHand: Card[];
  aiHand: Card[];
  discardPile: Card[];
  turn: Turn;
  phase: GamePhase;
  status: GameStatus;
  winner: Player | 'draw' | null;
  loadingMessage: string | null;
  playerScore: number;
  aiScore: number;
}

export interface Meld {
    type: 'set' | 'run';
    cards: Card[];
}
