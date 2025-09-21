import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 pointer-events-auto">
      <Card className="w-full max-w-2xl bg-gray-800 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">How to Play Jin Rummy</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <span className="text-2xl">&times;</span>
            </Button>
          </div>
          <CardDescription>A guide to the rules and scoring.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-gray-300">
          <div>
            <h4 className="font-bold text-lg text-white mb-1">Objective</h4>
            <p>
              Be the first player to reach 100 points. Points are scored over several rounds by forming your 10-card hand into melds and having less "deadwood" (unmatched cards) than your opponent.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-lg text-white mb-1">Card Values</h4>
            <ul className="list-disc list-inside">
              <li><strong>Aces:</strong> 1 point</li>
              <li><strong>Number cards (2-10):</strong> Face value</li>
              <li><strong>Face cards (J, Q, K):</strong> 10 points</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg text-white mb-1">Melds</h4>
            <p>A meld is a combination of cards in your hand.</p>
            <ul className="list-disc list-inside mt-1">
              <li><strong>Set:</strong> Three or four cards of the same rank (e.g., 7♥ 7♦ 7♠).</li>
              <li><strong>Run:</strong> Three or more cards of the same suit in sequence (e.g., 4♣ 5♣ 6♣).</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg text-white mb-1">Gameplay</h4>
            <ol className="list-decimal list-inside">
              <li><strong>Draw:</strong> On your turn, you must draw one card from either the face-down <strong>Deck</strong> or the face-up <strong>Discard Pile</strong>.</li>
              <li><strong>Discard:</strong> After drawing, you must discard one card from your hand to the Discard Pile. Your hand will have 10 cards after you discard.</li>
            </ol>
          </div>
          <div>
            <h4 className="font-bold text-lg text-white mb-1">Knocking</h4>
            <p>
              You can end the round by "knocking" if the total value of your deadwood is 10 points or less. To knock, discard a card as usual, then click the "Knock" button. You do not have to knock, even if you can.
            </p>
          </div>
           <div>
            <h4 className="font-bold text-lg text-white mb-1">Scoring</h4>
            <ul className="list-disc list-inside">
                <li><strong>Knocking:</strong> If you knock and have less deadwood, you score the difference between your deadwood and your opponent's.</li>
                <li><strong>Undercut:</strong> If the opponent has an equal or lower deadwood score, they score the difference plus a 25-point bonus.</li>
                <li><strong>Gin:</strong> If you form melds with all 10 cards (0 deadwood), you get a 25-point bonus plus the opponent's entire deadwood value.</li>
            </ul>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={onClose}>Close</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
