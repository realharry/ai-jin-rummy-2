import React, { useState, useEffect, useReducer } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameUI } from './components/GameUI';
import { HelpModal } from './components/HelpModal';
// FIX: Import GamePhase as a value to use its members, and keep other types as type-only imports.
import type { Card, GameState, Player, Turn } from './types';
import { GameStatus, GamePhase } from './types';
import { createInitialGameState, getDeadwood, checkForGin, prepareNextRoundState } from './services/gameLogic';
import { getAIDecision } from './services/aiService';
import { loadSounds, playSound, toggleMute, getIsMuted } from './services/soundService';

type GameAction =
  | { type: 'START_GAME' }
  | { type: 'DRAW_FROM_DECK' }
  | { type: 'DRAW_FROM_DISCARD' }
  | { type: 'DISCARD_CARD'; card: Card }
  | { type: 'END_TURN' }
  | { type: 'KNOCK' }
  | { type: 'RESTART_GAME' }
  | { type: 'NEXT_ROUND' }
  | { type: 'SET_LOADING'; payload: string | null }
  | { type: 'AI_TURN_COMPLETE'; payload: { newDeck: Card[], newDiscardPile: Card[], newAiHand: Card[] } };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
    case 'RESTART_GAME':
      return createInitialGameState();
    case 'DRAW_FROM_DECK': {
      if (state.turn !== 'player' || state.phase !== GamePhase.DRAW) return state;
      const newDeck = [...state.deck];
      const drawnCard = newDeck.pop();
      if (!drawnCard) return state; // Should not happen
      const newPlayerHand = [...state.playerHand, drawnCard];
      return { ...state, deck: newDeck, playerHand: newPlayerHand, phase: GamePhase.DISCARD };
    }
    case 'DRAW_FROM_DISCARD': {
      if (state.turn !== 'player' || state.phase !== GamePhase.DRAW || state.discardPile.length === 0) return state;
      const newDiscardPile = [...state.discardPile];
      const drawnCard = newDiscardPile.pop();
      if (!drawnCard) return state;
      const newPlayerHand = [...state.playerHand, drawnCard];
      return { ...state, discardPile: newDiscardPile, playerHand: newPlayerHand, phase: GamePhase.DISCARD };
    }
    case 'DISCARD_CARD': {
      if (state.turn !== 'player' || state.phase !== GamePhase.DISCARD) return state;
      const newPlayerHand = state.playerHand.filter(c => !(c.rank === action.card.rank && c.suit === action.card.suit));
      if(newPlayerHand.length !== 10) return state;
      const newDiscardPile = [...state.discardPile, action.card];
      return { ...state, playerHand: newPlayerHand, discardPile: newDiscardPile };
    }
    case 'END_TURN': {
       const nextTurn: Turn = state.turn === 'player' ? 'ai' : 'player';
       return { ...state, turn: nextTurn, phase: GamePhase.DRAW };
    }
    case 'KNOCK': {
        const playerDeadwoodResult = getDeadwood(state.playerHand);
        const aiDeadwoodResult = getDeadwood(state.aiHand);
        const playerDeadwood = playerDeadwoodResult.total;
        const aiDeadwood = aiDeadwoodResult.total;
        
        let roundWinner: Player | null = null;
        let points = 0;
        let message = '';
        let newPlayerScore = state.playerScore;
        let newAiScore = state.aiScore;

        const isPlayerGin = playerDeadwood === 0;

        if (isPlayerGin) {
            roundWinner = 'player';
            points = aiDeadwood + 25; // Gin bonus
            newPlayerScore += points;
            message = `You got Gin! +${points} points.`;
        } else if (playerDeadwood < aiDeadwood) {
            roundWinner = 'player';
            points = aiDeadwood - playerDeadwood;
            newPlayerScore += points;
            message = `You won the round. Deadwood: You ${playerDeadwood}, AI ${aiDeadwood}. +${points} points.`;
        } else { // Undercut by AI
            roundWinner = 'ai';
            points = playerDeadwood - aiDeadwood + 25; // Undercut bonus
            newAiScore += points;
            message = `AI undercut you! Deadwood: AI ${aiDeadwood}, You ${playerDeadwood}. AI gets +${points} points.`;
        }

        if (newPlayerScore >= 100 || newAiScore >= 100) {
            const gameWinner = newPlayerScore >= newAiScore ? 'player' : 'ai';
            return { 
                ...state, 
                status: GameStatus.FINISHED, 
                winner: gameWinner,
                playerScore: newPlayerScore,
                aiScore: newAiScore,
                loadingMessage: `Game Over! ${gameWinner === 'player' ? 'You win' : 'AI wins'}! Final Score - You: ${newPlayerScore}, AI: ${newAiScore}` 
            };
        }

        return { 
            ...state, 
            status: GameStatus.ROUND_OVER,
            winner: roundWinner,
            playerScore: newPlayerScore,
            aiScore: newAiScore,
            loadingMessage: message,
        };
    }
     case 'NEXT_ROUND':
      return prepareNextRoundState(state);
    case 'AI_TURN_COMPLETE': {
        const { newDeck, newDiscardPile, newAiHand } = action.payload;
        const isAiGin = checkForGin(newAiHand);
        if (isAiGin) {
            const playerDeadwood = getDeadwood(state.playerHand).total;
            const points = playerDeadwood + 25;
            const newAiScore = state.aiScore + points;
            const message = `AI got Gin! +${points} points.`;
    
            if (newAiScore >= 100) {
                return {
                    ...state,
                    aiHand: newAiHand,
                    deck: newDeck,
                    discardPile: newDiscardPile,
                    status: GameStatus.FINISHED,
                    winner: 'ai',
                    aiScore: newAiScore,
                    loadingMessage: `Game Over! AI wins with Gin! Final Score - You: ${state.playerScore}, AI: ${newAiScore}`
                };
            }
    
            return {
                ...state,
                aiHand: newAiHand,
                deck: newDeck,
                discardPile: newDiscardPile,
                status: GameStatus.ROUND_OVER,
                winner: 'ai',
                aiScore: newAiScore,
                loadingMessage: message,
            };
        }
        
        return {
            ...state,
            deck: newDeck,
            discardPile: newDiscardPile,
            aiHand: newAiHand,
            turn: 'player',
            phase: GamePhase.DRAW,
            loadingMessage: null
        };
    }
    case 'SET_LOADING':
        return {...state, loadingMessage: action.payload};
    default:
      return state;
  }
}


export default function App() {
  const [gameState, dispatch] = useReducer(gameReducer, createInitialGameState());
  const [isMounted, setIsMounted] = useState(false);
  const [isMuted, setIsMuted] = useState(getIsMuted());
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    loadSounds();
    dispatch({ type: 'START_GAME' });
    playSound('shuffle');
  }, []);

  const handleToggleMute = () => {
    toggleMute();
    setIsMuted(getIsMuted());
  }

  const handleShowHelp = () => setShowHelp(true);
  const handleCloseHelp = () => setShowHelp(false);

  const handlePlayerDraw = (source: 'deck' | 'discard') => {
    if (gameState.turn === 'player' && gameState.phase === GamePhase.DRAW) {
      if (source === 'deck') {
        dispatch({ type: 'DRAW_FROM_DECK' });
        playSound('drawDeck');
      } else {
        dispatch({ type: 'DRAW_FROM_DISCARD' });
        playSound('drawDiscard');
      }
    }
  };

  const handlePlayerDiscard = (card: Card) => {
    if (gameState.turn === 'player' && gameState.phase === GamePhase.DISCARD) {
      dispatch({ type: 'DISCARD_CARD', card });
      playSound('discard');
      // Use a timeout to allow discard animation to play before AI turn starts
      setTimeout(() => dispatch({ type: 'END_TURN' }), 700);
    }
  };
  
  const handleKnock = () => {
    if(gameState.turn === 'player' && getDeadwood(gameState.playerHand).total <= 10){
       dispatch({type: 'KNOCK'});
    } else {
       // Optionally show a message that knock is not possible
       console.log("Cannot knock. Deadwood is over 10.");
    }
  };
  
  const handleRestart = () => {
      dispatch({type: 'RESTART_GAME'});
      playSound('shuffle');
  }

  const handleNextRound = () => {
      dispatch({type: 'NEXT_ROUND'});
      playSound('shuffle');
  }
  
  // Effect for handling end-of-round/game sounds
  useEffect(() => {
    if (gameState.status === GameStatus.ROUND_OVER) {
        if (gameState.winner === 'player') {
            playSound('win');
        } else if (gameState.winner === 'ai') {
            playSound('lose');
        }
    } else if (gameState.status === GameStatus.FINISHED) {
        if (gameState.winner === 'player') {
            playSound('gameWin');
        } else if (gameState.winner === 'ai') {
            playSound('gameLose');
        }
    }
  }, [gameState.status, gameState.winner]);


  // AI turn logic
  useEffect(() => {
    if (gameState.turn === 'ai' && gameState.status === GameStatus.PLAYING) {
      const performAITurn = async () => {
        dispatch({type: 'SET_LOADING', payload: 'AI is thinking...'});

        // Brief pause before AI starts its turn
        await new Promise(res => setTimeout(res, 500));

        // 1. AI decides to draw
        const topDiscard = gameState.discardPile.length > 0 ? gameState.discardPile[gameState.discardPile.length - 1] : null;
        const drawDecision = await getAIDecision(gameState.aiHand, topDiscard);

        let handAfterDraw: Card[];
        let newDeck = [...gameState.deck];
        // FIX: Use `gameState` which is in scope, instead of the undefined `state`.
        let newDiscardPile = [...gameState.discardPile];

        if (drawDecision.drawFromDiscard && topDiscard) {
            newDiscardPile.pop();
            handAfterDraw = [...gameState.aiHand, topDiscard];
            playSound('drawDiscard');
        } else {
            const drawnCard = newDeck.pop();
            if (!drawnCard) { // Deck is empty, end game or reshuffle
                dispatch({type: 'KNOCK'}); // Simplified ending
                return;
            }
            handAfterDraw = [...gameState.aiHand, drawnCard];
            playSound('drawDeck');
        }
        
        // Brief pause to simulate drawing and thinking
        await new Promise(res => setTimeout(res, 1200));
        
        // 2. AI decides which card to discard
        dispatch({type: 'SET_LOADING', payload: 'AI is choosing a card to discard...'});
        const discardDecision = await getAIDecision(handAfterDraw, null);

        let finalAIHand = [...handAfterDraw];
        if (discardDecision.cardToDiscard) {
            const cardToDiscard = discardDecision.cardToDiscard;
            finalAIHand = handAfterDraw.filter(c => !(c.rank === cardToDiscard.rank && c.suit === cardToDiscard.suit));
            newDiscardPile.push(cardToDiscard);
        } else {
            // Failsafe: if AI fails to choose, discard the last card drawn
            const failsafeDiscard = finalAIHand.pop()!;
            newDiscardPile.push(failsafeDiscard);
        }
        
        playSound('discard');

        dispatch({
          type: 'AI_TURN_COMPLETE',
          payload: {
            newDeck,
            newDiscardPile,
            newAiHand: finalAIHand,
          },
        });
      };

      performAITurn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.turn, gameState.status]);


  if (!isMounted) {
    return <div className="w-screen h-screen flex items-center justify-center bg-gray-900 text-white">Loading Game...</div>;
  }

  return (
    <main className="w-screen h-screen bg-gray-800 text-white flex flex-col items-center justify-center overflow-hidden">
      <GameUI 
        gameState={gameState} 
        onKnock={handleKnock}
        onRestart={handleRestart}
        onNextRound={handleNextRound}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onShowHelp={handleShowHelp}
      />
      <div className="w-full flex-grow relative">
        <GameCanvas 
          gameState={gameState} 
          onDraw={handlePlayerDraw} 
          onDiscard={handlePlayerDiscard} 
        />
      </div>
      <HelpModal isOpen={showHelp} onClose={handleCloseHelp} />
    </main>
  );
}