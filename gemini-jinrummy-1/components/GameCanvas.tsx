import React, { useRef, useEffect, useState } from 'react';
import type { Application, Sprite, Texture } from 'pixi.js';
import type { GameState, Card } from '../types';
import { SUIT_COLORS, SUITS, RANKS } from '../constants';
import { GameStatus } from '../types';
import { findMelds, sortHand } from '../services/gameLogic';

// This is a global because we load PIXI from CDN
declare const PIXI: any;
declare const gsap: any;

interface GameCanvasProps {
  gameState: GameState;
  onDraw: (source: 'deck' | 'discard') => void;
  onDiscard: (card: Card) => void;
}

const CARD_WIDTH = 70;
const CARD_HEIGHT = 100;
const CARD_ROUNDING = 8;

const getCardId = (card: Card) => `${card.rank}-${card.suit}`;

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onDraw, onDiscard }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const spritesRef = useRef<Map<string, Sprite>>(new Map());
  const [prevGameState, setPrevGameState] = useState<GameState | null>(null);
  
  const texturesRef = useRef<{
    front: Map<string, Texture>,
    back: Texture[]
  }>({ front: new Map(), back: [] });
  const activeBackIndexRef = useRef(0);

  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;

    const app = new PIXI.Application({
      background: '#1a202c', // bg-gray-800
      resizeTo: canvasRef.current,
      antialias: true,
    });
    appRef.current = app;
    
    // --- Create All Textures (only once) ---
    if (texturesRef.current.front.size === 0) {
      const renderer = app.renderer;
      const frontTextures = texturesRef.current.front;
      const backTextures = texturesRef.current.back;

      // --- Create Back Textures ---
      // Design 1: Blue Circles
      const backGraphicsBlue = new PIXI.Graphics();
      backGraphicsBlue.beginFill(0x5555ff);
      backGraphicsBlue.lineStyle(2, 0xffffff, 1);
      backGraphicsBlue.drawRoundedRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_ROUNDING);
      backGraphicsBlue.endFill();
      const patternBlue = new PIXI.Graphics();
      patternBlue.beginFill(0x3333dd);
      for(let i = 0; i < 20; i++) {
          patternBlue.drawCircle(Math.random() * CARD_WIDTH, Math.random() * CARD_HEIGHT, 4);
      }
      patternBlue.endFill();
      backGraphicsBlue.addChild(patternBlue);
      backTextures.push(renderer.generateTexture(backGraphicsBlue));
      
      // Design 2: Red Diamonds
      const backGraphicsRed = new PIXI.Graphics();
      backGraphicsRed.beginFill(0xdd3333); // Red background
      backGraphicsRed.lineStyle(2, 0xffffff, 1);
      backGraphicsRed.drawRoundedRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_ROUNDING);
      backGraphicsRed.endFill();
      const patternRed = new PIXI.Graphics();
      patternRed.beginFill(0xaa1111, 0.5); // Darker red for pattern
      for (let y = -1; y < CARD_HEIGHT / 10; y++) {
          for (let x = -1; x < CARD_WIDTH / 10; x++) {
              patternRed.beginFill(0xaa1111, (x+y)%2 === 0 ? 0.5 : 0.2);
              patternRed.drawRect(x * 10, y * 10, 10, 10);
          }
      }
      backGraphicsRed.addChild(patternRed);
      backTextures.push(renderer.generateTexture(backGraphicsRed));
      
      // Design 3: Green Stripes
      const backGraphicsGreen = new PIXI.Graphics();
      backGraphicsGreen.beginFill(0x33aa33); // Green background
      backGraphicsGreen.lineStyle(2, 0xffffff, 1);
      backGraphicsGreen.drawRoundedRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_ROUNDING);
      backGraphicsGreen.endFill();
      const patternGreen = new PIXI.Graphics();
      patternGreen.lineStyle(10, 0x228822, 0.8); // Darker green stripes
      for (let i = -CARD_WIDTH; i < CARD_WIDTH + CARD_HEIGHT; i += 25) {
          patternGreen.moveTo(i, -5);
          patternGreen.lineTo(i - CARD_HEIGHT - 10, CARD_HEIGHT + 5);
      }
      backGraphicsGreen.addChild(patternGreen);
      backTextures.push(renderer.generateTexture(backGraphicsGreen));

      // --- Create Front Textures for all 52 cards ---
      SUITS.forEach(suit => {
          const suitDetails = SUIT_COLORS[suit];
          RANKS.forEach(rank => {
              const cardData = { suit, rank };
              
              const frontContainer = new PIXI.Container();
              const faceGraphics = new PIXI.Graphics();
              faceGraphics.beginFill(0xffffff);
              faceGraphics.lineStyle(2, 0x000000, 1);
              faceGraphics.drawRoundedRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_ROUNDING);
              faceGraphics.endFill();

              const rankText = new PIXI.Text(rank, { fontFamily: 'Arial', fontSize: 20, fill: suitDetails.color, align: 'center' });
              rankText.x = 8;
              rankText.y = 5;

              const suitText = new PIXI.Text(suitDetails.symbol, { fontFamily: 'Arial', fontSize: 40, fill: suitDetails.color, align: 'center' });
              suitText.anchor.set(0.5);
              suitText.x = CARD_WIDTH / 2;
              suitText.y = CARD_HEIGHT / 2;

              frontContainer.addChild(faceGraphics);
              frontContainer.addChild(rankText);
              frontContainer.addChild(suitText);
              const frontTexture = renderer.generateTexture(frontContainer);
              
              frontTextures.set(getCardId(cardData as Card), frontTexture);
          });
      });
    }

    canvasRef.current.appendChild(app.view as HTMLCanvasElement);
    
    return () => {
      app.destroy(true, { children: true, texture: true, baseTexture: true });
      appRef.current = null;
    };
  }, []);

  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    // --- Detect New Round and Select Card Back ---
    const isNewGame = prevGameState === null && gameState.status === GameStatus.PLAYING;
    const isNewRound = prevGameState?.status === GameStatus.ROUND_OVER && gameState.status === GameStatus.PLAYING;
    if ((isNewGame || isNewRound) && texturesRef.current.back.length > 0) {
        activeBackIndexRef.current = Math.floor(Math.random() * texturesRef.current.back.length);
    }
    const activeBackTexture = texturesRef.current.back[activeBackIndexRef.current];
    if (!activeBackTexture) return; // Textures not ready

    const { width, height } = app.screen;
    const isMobile = width < 768;
    const aiHandY = isMobile ? 140 : 20;
    const playerHandY = height - CARD_HEIGHT - 20;
    const middleAreaTop = aiHandY + CARD_HEIGHT;
    const middleAreaBottom = playerHandY;
    const middleY = middleAreaTop + (middleAreaBottom - middleAreaTop) / 2;
    const deckY = middleY - CARD_HEIGHT / 2;
    const deckX = width / 2 - CARD_WIDTH * 1.5;
    const discardX = width / 2 + CARD_WIDTH * 0.5;

    // --- Responsive Card Spacing Logic ---
    const calculateCardSpacing = (handLength: number, screenWidth: number): number => {
        const defaultSpacing = CARD_WIDTH * 0.6;
        const padding = 20; // 10px on each side
        const maxHandWidth = screenWidth - padding;
        
        if (handLength <= 1) return 0; // No spacing for 0 or 1 card

        const requiredWidth = (handLength - 1) * defaultSpacing + CARD_WIDTH;

        if (requiredWidth > maxHandWidth) {
            // Hand is too wide, calculate compressed spacing
            return (maxHandWidth - CARD_WIDTH) / (handLength - 1);
        }
        
        // Enough space, use default
        return defaultSpacing;
    };

    // --- Sync Sprites with GameState ---
    const allCardsInGameState = new Set([...gameState.deck, ...gameState.playerHand, ...gameState.aiHand, ...gameState.discardPile].map(getCardId));
    
    spritesRef.current.forEach((sprite, cardId) => {
        if (!allCardsInGameState.has(cardId)) {
            sprite.destroy();
            spritesRef.current.delete(cardId);
        }
    });

    allCardsInGameState.forEach(cardId => {
        if (!spritesRef.current.has(cardId)) {
            const cardData = [...gameState.deck, ...gameState.playerHand, ...gameState.aiHand, ...gameState.discardPile].find(c => getCardId(c) === cardId)!;
            const isPlayerCard = gameState.playerHand.some(c => getCardId(c) === cardId);
            const isDiscardTop = gameState.discardPile.length > 0 && getCardId(gameState.discardPile[gameState.discardPile.length - 1]) === cardId;
            
            const texture = (isPlayerCard || isDiscardTop) ? texturesRef.current.front.get(cardId)! : activeBackTexture;
            const sprite = new PIXI.Sprite(texture);
            sprite.interactive = true;
            sprite.buttonMode = true;
            // @ts-ignore
            sprite.cardData = cardData;

            spritesRef.current.set(cardId, sprite);
            app.stage.addChild(sprite);
        }
    });

    // --- Animate based on status ---
    if (gameState.status === GameStatus.ROUND_OVER || gameState.status === GameStatus.FINISHED) {
        const tl = gsap.timeline();
        
        // Reveal AI hand
        gameState.aiHand.forEach(card => {
            const sprite = spritesRef.current.get(getCardId(card));
            if (sprite) {
                const frontTexture = texturesRef.current.front.get(getCardId(card))!;
                tl.to(sprite.scale, { x: 0, duration: 0.15, onComplete: () => sprite.texture = frontTexture }, '<');
                tl.to(sprite.scale, { x: 1, duration: 0.15 });
            }
        });

        // Sort hands into melds and deadwood
        const positionHandWithMelds = (hand: Card[], y: number, isPlayer: boolean) => {
            const { melds, remainingCards } = findMelds(hand);
            let currentX = 20;
            let zIndex = 0;
            const allSortedCards = [...melds.flatMap(m => m.cards), ...remainingCards];

            allSortedCards.forEach(card => {
                const sprite = spritesRef.current.get(getCardId(card));
                if(sprite) {
                    if(isPlayer) sprite.texture = texturesRef.current.front.get(getCardId(card))!;
                    tl.to(sprite, { x: currentX, y, duration: 0.4 }, "-=0.2");
                    sprite.zIndex = zIndex++;
                }
                currentX += CARD_WIDTH * 0.4;
            });
        };
        
        app.stage.sortableChildren = true;
        positionHandWithMelds(gameState.playerHand, playerHandY, true);
        positionHandWithMelds(gameState.aiHand, aiHandY, false);

        // Remove deck and discard pile
        [...gameState.deck, ...gameState.discardPile].forEach(c => spritesRef.current.get(getCardId(c))?.destroy());

    } else { // Game is playing
        const wasAITurn = prevGameState && prevGameState.turn === 'ai' && gameState.turn === 'player';
        if (wasAITurn) {
            const drawnCard = gameState.aiHand.find(c => !prevGameState.aiHand.some(pc => getCardId(c) === getCardId(pc)));
            
            if (drawnCard) {
                const drawnFromDeck = prevGameState.deck.length > gameState.deck.length;
                const drawnSprite = spritesRef.current.get(getCardId(drawnCard))!;

                if (drawnSprite) {
                    const sourcePos = { x: drawnFromDeck ? deckX : discardX, y: deckY };
                    
                    drawnSprite.x = sourcePos.x;
                    drawnSprite.y = sourcePos.y;
                    // @ts-ignore
                    drawnSprite.isAnimating = true;

                    app.stage.setChildIndex(drawnSprite, app.stage.children.length - 1);
                    const tl = gsap.timeline({
                        onComplete: () => { // @ts-ignore
                           drawnSprite.isAnimating = false;
                        }
                    });

                    const aiHandSpacing = calculateCardSpacing(gameState.aiHand.length, width);
                    const aiHandWidth = gameState.aiHand.length > 0 ? (gameState.aiHand.length - 1) * aiHandSpacing + CARD_WIDTH : 0;
                    const aiHandXStart = (width - aiHandWidth) / 2;
                    const cardIndex = gameState.aiHand.findIndex(c => getCardId(c) === getCardId(drawnCard));
                    const targetX = aiHandXStart + cardIndex * aiHandSpacing;

                    tl.to(drawnSprite, { x: (sourcePos.x + targetX) / 2, y: aiHandY - 60, duration: 0.4, ease: 'power1.out' });
                    
                    if (!drawnFromDeck) {
                        tl.to(drawnSprite.scale, { x: 0, duration: 0.15, onComplete: () => drawnSprite.texture = activeBackTexture });
                        tl.to(drawnSprite.scale, { x: 1, duration: 0.15 });
                    }

                    tl.to(drawnSprite, { x: targetX, y: aiHandY, duration: 0.4, ease: 'power1.in' });
                }
            }
        }
        
        const wasPlayerDiscard = prevGameState &&
            prevGameState.playerHand.length > gameState.playerHand.length &&
            gameState.discardPile.length > prevGameState.discardPile.length &&
            prevGameState.turn === 'player';

        if (wasPlayerDiscard) {
            const discardedCard = prevGameState.playerHand.find(c => !gameState.playerHand.some(gc => getCardId(c) === getCardId(gc)));
            if (discardedCard) {
                const discardedSprite = spritesRef.current.get(getCardId(discardedCard))!;
                if (discardedSprite) {
                    // @ts-ignore
                    discardedSprite.isAnimating = true;
                    app.stage.setChildIndex(discardedSprite, app.stage.children.length - 1);
                    gsap.to(discardedSprite, {
                        x: discardX,
                        y: deckY,
                        duration: 0.5,
                        ease: 'power2.out',
                        onComplete: () => { // @ts-ignore
                            discardedSprite.isAnimating = false;
                        }
                    });
                }
            }
        }

        // --- RENDER ORDER + POSITIONS ---
        app.stage.sortableChildren = true;
        const deckBaseZ = 0;
        const discardBaseZ = deckBaseZ + gameState.deck.length;
        const aiHandBaseZ = discardBaseZ + gameState.discardPile.length;
        const playerHandBaseZ = aiHandBaseZ + gameState.aiHand.length;

        // --- RENDER DECK ---
        gameState.deck.forEach((card, i) => {
            const sprite = spritesRef.current.get(getCardId(card))!;
            sprite.texture = activeBackTexture;
            sprite.x = deckX + i * 0.2;
            sprite.y = deckY + i * 0.2;
            sprite.zIndex = deckBaseZ + i;
        });
        const topDeckCard = gameState.deck[gameState.deck.length - 1];
        if (topDeckCard) {
            const topDeckSprite = spritesRef.current.get(getCardId(topDeckCard))!;
            topDeckSprite.interactive = gameState.turn === 'player' && gameState.phase === 'draw';
            topDeckSprite.removeAllListeners('pointerdown');
            topDeckSprite.on('pointerdown', () => onDraw('deck'));
        }
        
        // --- RENDER DISCARD PILE ---
        gameState.discardPile.forEach((card, i) => {
            const sprite = spritesRef.current.get(getCardId(card))!;
            sprite.texture = texturesRef.current.front.get(getCardId(card))!;
            const isTop = i === gameState.discardPile.length - 1;
            
            sprite.interactive = isTop && gameState.turn === 'player' && gameState.phase === 'draw' && gameState.discardPile.length > 0;
            sprite.removeAllListeners('pointerdown');
            if (isTop && sprite.interactive) {
                sprite.on('pointerdown', () => onDraw('discard'));
            }

            // @ts-ignore
            if (!sprite.isAnimating) {
                gsap.to(sprite, { x: discardX, y: deckY, duration: 0.3 });
            }
            sprite.zIndex = discardBaseZ + i;
        });

        // --- RENDER AI HAND ---
        const aiHandSpacing = calculateCardSpacing(gameState.aiHand.length, width);
        const aiHandWidth = gameState.aiHand.length > 0 ? (gameState.aiHand.length - 1) * aiHandSpacing + CARD_WIDTH : 0;
        const aiHandXStart = (width - aiHandWidth) / 2;
        gameState.aiHand.forEach((card, i) => {
            const sprite = spritesRef.current.get(getCardId(card))!;
            sprite.texture = activeBackTexture;
             // @ts-ignore
            if (!sprite.isAnimating) {
               gsap.to(sprite, { x: aiHandXStart + i * aiHandSpacing, y: aiHandY, duration: 0.3 });
            }
            sprite.zIndex = aiHandBaseZ + i;
        });

        // --- RENDER PLAYER HAND ---
        const sortedPlayerHand = sortHand(gameState.playerHand);
        const playerHandSpacing = calculateCardSpacing(sortedPlayerHand.length, width);
        const playerHandWidth = sortedPlayerHand.length > 0 ? (sortedPlayerHand.length - 1) * playerHandSpacing + CARD_WIDTH : 0;
        const playerHandXStart = (width - playerHandWidth) / 2;
        
        const wasPlayerDraw = prevGameState && prevGameState.playerHand.length < gameState.playerHand.length;

        if (wasPlayerDraw) {
            const drawnCard = gameState.playerHand.find(c => !prevGameState.playerHand.some(pc => getCardId(c) === getCardId(pc)))!;
            const drawnFromDeck = prevGameState.deck.length > gameState.deck.length;
            const sourcePos = { x: drawnFromDeck ? deckX : discardX, y: deckY };
            
            const tl = gsap.timeline();
            const drawnSprite = spritesRef.current.get(getCardId(drawnCard))!;
            drawnSprite.texture = texturesRef.current.front.get(getCardId(drawnCard))!;
            drawnSprite.x = sourcePos.x;
            drawnSprite.y = sourcePos.y;
            app.stage.setChildIndex(drawnSprite, app.stage.children.length - 1);
            
            if (!drawnFromDeck) {
                tl.to(drawnSprite, { y: drawnSprite.y - 20, duration: 0.2, ease: 'power1.out' });
                tl.to(drawnSprite.scale, { x: 0, duration: 0.15 }, "-=0.1");
                tl.to(drawnSprite.scale, { x: 1, duration: 0.15 });
            }

            tl.to(drawnSprite, {
                x: playerHandXStart + playerHandWidth / 2,
                y: playerHandY,
                duration: 0.5,
                ease: 'power2.out'
            });

            sortedPlayerHand.forEach((card, i) => {
                const sprite = spritesRef.current.get(getCardId(card))!;
                const targetX = playerHandXStart + i * playerHandSpacing;
                tl.to(sprite, { x: targetX, y: playerHandY, duration: 0.4, ease: 'power2.inOut' }, "-=0.3");
            });

        } else if (!wasPlayerDiscard) {
            sortedPlayerHand.forEach((card, i) => {
                const sprite = spritesRef.current.get(getCardId(card))!;
                const targetX = playerHandXStart + i * playerHandSpacing;
                 // @ts-ignore
                if (!sprite.isAnimating) {
                   gsap.to(sprite, { x: targetX, y: playerHandY, duration: 0.3 });
                }
            });
        }

        sortedPlayerHand.forEach((card, i) => {
            const sprite = spritesRef.current.get(getCardId(card))!;
            sprite.texture = texturesRef.current.front.get(getCardId(card))!;
            sprite.zIndex = playerHandBaseZ + i;
            sprite.interactive = gameState.turn === 'player' && gameState.phase === 'discard';
            sprite.removeAllListeners('pointerdown');
            sprite.on('pointerdown', () => onDiscard(card));
        });
    }

    setPrevGameState(JSON.parse(JSON.stringify(gameState)));
    
  }, [gameState, onDraw, onDiscard]);


  return <div ref={canvasRef} className="w-full h-full" />;
};