import { Component, OnDestroy } from '@angular/core';
import { GameService } from '../services/game.service';
import { Card } from '../core/card.model';

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
})
export class GamePage implements OnDestroy {
  lastResult: string = '';
  currentCardPlayer1: Card | null = null;
  currentCardPlayer2: Card | null = null;
  battleMessage: string = '';
  currentTurn: number = 1;
  autoPlayInterval: any;
  gameOverMessage: string = '';
  rulesModalOpen: boolean = false;
  gameEnded: boolean = false;

  constructor(public gameService: GameService) {}

  drawCard(player: number): void {
    if (this.gameOverMessage) {
      return;
    }
    if (player === 1 && this.currentTurn === 1) {
      if (this.currentCardPlayer1 && this.currentCardPlayer2) {
        this.resolveRound();
      }
      this.currentCardPlayer1 = this.gameService.drawCard(1);
      this.currentTurn = 2;
    } else if (player === 2 && this.currentTurn === 2) {
      this.currentCardPlayer2 = this.gameService.drawCard(2);
      this.resolveRound();
      this.currentTurn = 1;
    }
  }

  resolveRound(): void {
    if (this.currentCardPlayer1 && this.currentCardPlayer2) {
      this.lastResult = this.gameService.playRound();
      this.battleMessage = this.gameService.getBattleMessage();

      // Vérifie qu'il y a toujours 52 cartes au total
      const totalCards = this.getOverallCardCount();
      if (totalCards !== 52) {
        console.error(`Erreur : Le total des cartes n'est pas égal à 52 après le tour. Total actuel: ${totalCards}`);
      }

      this.currentCardPlayer1 = null;
      this.currentCardPlayer2 = null;
      this.gameOverMessage = this.gameService.getGameOverMessage();
      if (this.gameOverMessage) {
        this.stopAutoPlay();
        this.gameEnded = true;
        return;
      }
    }
  }

  getTotalCardCount(): number {
    return this.gameService.getPlayerDeck(1).length + this.gameService.getPlayerDeck(2).length;
  }

  getCardsOnTableCount(): number {
    return this.gameService.getTableCards().length;
  }

  getOverallCardCount(): number {
    return this.getTotalCardCount() + this.getCardsOnTableCount();
  }

  startAutoPlay(): void {
    if (this.autoPlayInterval || this.gameOverMessage) {
      return;
    }
    this.autoPlayInterval = setInterval(() => {
      this.drawCard(this.currentTurn);
    }, 1); // Ajustez le délai selon vos besoins
  }

  stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  toggleAutoPlay(): void {
    if (this.autoPlayInterval) {
      this.stopAutoPlay();
    } else {
      this.startAutoPlay();
    }
  }

  openRules(): void {
    this.rulesModalOpen = true;
  }

  closeRules(): void {
    this.rulesModalOpen = false;
  }

  restartGame(): void {
    this.stopAutoPlay();
    this.gameService.startGame();
    this.gameOverMessage = '';
    this.currentTurn = 1;
    this.currentCardPlayer1 = null;
    this.currentCardPlayer2 = null;
    this.gameEnded = false;

    // Vérification que le total des cartes est 52 après le redémarrage
    const totalCards = this.getOverallCardCount();
    if (totalCards !== 52) {
      console.error(`Erreur : Le total des cartes après le redémarrage n'est pas égal à 52. Total actuel: ${totalCards}`);
    }
  }

  getCardColorClass(suit: string): string {
    return (suit === '♥' || suit === '♦') ? 'red-border' : 'black-border';
  }

  getHistory(): { round: number, player1Cards: Card[], player2Cards: Card[], winner: string, player1Total: number, player2Total: number }[] {
    return this.gameService.getHistory(); // Return all rounds played
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }
}
