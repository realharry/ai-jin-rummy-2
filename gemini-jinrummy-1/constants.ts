import { Suit, Rank } from './types';

export const SUITS: Suit[] = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades];
export const RANKS: Rank[] = [
  Rank.Ace, Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven,
  Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King
];

export const RANK_VALUES: { [key in Rank]: number } = {
  [Rank.Ace]: 1,
  [Rank.Two]: 2,
  [Rank.Three]: 3,
  [Rank.Four]: 4,
  [Rank.Five]: 5,
  [Rank.Six]: 6,
  [Rank.Seven]: 7,
  [Rank.Eight]: 8,
  [Rank.Nine]: 9,
  [Rank.Ten]: 10,
  [Rank.Jack]: 10,
  [Rank.Queen]: 10,
  [Rank.King]: 10,
};

export const SUIT_COLORS: { [key in Suit]: { color: number, symbol: string, name: Suit } } = {
    [Suit.Hearts]: { color: 0xff0000, symbol: '♥', name: Suit.Hearts },
    [Suit.Diamonds]: { color: 0xff0000, symbol: '♦', name: Suit.Diamonds },
    [Suit.Clubs]: { color: 0x000000, symbol: '♣', name: Suit.Clubs },
    [Suit.Spades]: { color: 0x000000, symbol: '♠', name: Suit.Spades },
};