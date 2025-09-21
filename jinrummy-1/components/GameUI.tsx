import React from 'react';
import type { GameState } from '../types';
import { GamePhase, GameStatus } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { getDeadwood } from '../services/gameLogic';

interface GameUIProps {
  gameState: GameState;
  onKnock: () => void;
  onRestart: () => void;
  onNextRound: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onShowHelp: () => void;
}

export const GameUI: React.FC<GameUIProps> = ({ gameState, onKnock, onRestart, onNextRound, isMuted, onToggleMute, onShowHelp }) => {
    
  const getStatusMessage = () => {
    if (gameState.loadingMessage) return gameState.loadingMessage;
    if (gameState.status === GameStatus.FINISHED) {
        if (gameState.winner) {
            return gameState.winner === 'player' ? 'You Win!' : (gameState.winner === 'ai' ? 'AI Wins!' : 'It\'s a Draw!');
        }
        return 'Game Over!';
    }
    if (gameState.turn === 'player') {
      return gameState.phase === GamePhase.DRAW ? 'Your Turn: Draw a card' : 'Your Turn: Discard a card';
    }
    return 'AI Turn';
  };

  const playerDeadwood = getDeadwood(gameState.playerHand).total;
  const canKnock = playerDeadwood <= 10 && gameState.turn === 'player' && gameState.phase === GamePhase.DISCARD;

  return (
    <div className="absolute top-0 left-0 w-full h-full p-2 md:p-4 pointer-events-none flex flex-col items-center z-10">
      <div className="w-full flex flex-wrap justify-between items-start gap-y-2">
        <div className="flex gap-1 md:gap-2 pointer-events-auto">
            <Card className="bg-gray-700/80 border-gray-600 text-white">
                <CardHeader className="p-1 md:p-2">
                    <CardTitle className="text-xs md:text-sm">AI Score</CardTitle>
                </CardHeader>
                <CardContent className="p-1 md:p-2 text-center text-base md:text-lg font-bold">
                    {gameState.aiScore}
                </CardContent>
            </Card>
            <Card className="bg-gray-700/80 border-gray-600 text-white">
                <CardHeader className="p-1 md:p-2">
                    <CardTitle className="text-xs md:text-sm">AI Hand</CardTitle>
                </CardHeader>
                <CardContent className="p-1 md:p-2 text-center text-base md:text-lg font-bold">
                    {gameState.aiHand.length} cards
                </CardContent>
            </Card>
        </div>
        
        <div className="text-center w-full md:w-auto order-first md:order-none">
            <h1 className="text-xl md:text-2xl font-bold tracking-wider">AI Jin Rummy</h1>
            <p className="text-base md:text-lg animate-pulse">{getStatusMessage()}</p>
        </div>

        <div className="flex gap-1 md:gap-2 items-start pointer-events-auto">
            <Card className="bg-gray-700/80 border-gray-600 text-white">
                <CardHeader className="p-1 md:p-2">
                    <CardTitle className="text-xs md:text-sm">Your Score</CardTitle>
                </CardHeader>
                <CardContent className="p-1 md:p-2 text-center text-base md:text-lg font-bold">
                    {gameState.playerScore}
                </CardContent>
            </Card>
            <Card className="bg-gray-700/80 border-gray-600 text-white">
                <CardHeader className="p-1 md:p-2">
                    <CardTitle className="text-xs md:text-sm">Your Deadwood</CardTitle>
                </CardHeader>
                <CardContent className="p-1 md:p-2 text-center text-base md:text-lg font-bold">
                    {playerDeadwood}
                </CardContent>
            </Card>
            <Button 
              onClick={onShowHelp} 
              variant="ghost" 
              size="icon" 
              className="w-8 h-8 md:w-10 md:h-10 shrink-0 border border-gray-500 text-gray-200 hover:bg-gray-700 hover:text-white"
            >
              ?
            </Button>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex gap-4 pointer-events-auto">
        <Button onClick={onToggleMute} variant="outline" size="icon">
          {isMuted ? '🔇' : '🔊'}
        </Button>
        {gameState.status === GameStatus.PLAYING && (
            <Button onClick={onKnock} disabled={!canKnock} variant="destructive">
                Knock
            </Button>
        )}
        {gameState.status === GameStatus.ROUND_OVER && (
            <Button onClick={onNextRound} variant="secondary">
                Next Round
            </Button>
        )}
        {gameState.status === GameStatus.FINISHED && (
             <Button onClick={onRestart} variant="secondary">
                New Game
            </Button>
        )}
      </div>
    </div>
  );
};