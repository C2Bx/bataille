import { Component, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
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
  winnerDeclared: string = ''; // Nouveau: Variable pour stocker le nom du gagnant
  rulesModalOpen: boolean = false;
  gameEnded: boolean = false;
  cardsDistributed: boolean = false;
  autoScrollEnabled: boolean = true;

  @ViewChild('historyContainer', { static: false }) historyContainer!: ElementRef;

  constructor(public gameService: GameService, private cdRef: ChangeDetectorRef) {}

  distributeCards(): void {
    this.gameService.startGame();
    this.cardsDistributed = true;
    this.currentTurn = 1;
    this.currentCardPlayer1 = null;
    this.currentCardPlayer2 = null;
    this.gameEnded = false;
    this.winnerDeclared = ''; // Réinitialiser le nom du gagnant
    this.cdRef.detectChanges();
  }

  drawCard(player: number): void {
    if (!this.cardsDistributed || this.gameService.getGameOverMessage()) {
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
        this.currentTurn = 1;
    }

    this.cdRef.detectChanges();
    if (this.autoScrollEnabled) {
      this.scrollToBottom();
    }
  }

  resolveRound(): void {
    if (this.currentCardPlayer1 && this.currentCardPlayer2) {
      this.gameService.playRound();
      if (this.gameService.getGameOverMessage()) {
        this.stopAutoPlay();
        this.gameEnded = true;
        this.gameOverMessage = this.gameService.getGameOverMessage();
        this.winnerDeclared = this.gameService.getWinner(); // Nouveau: Obtenir le nom du gagnant
      }
      this.currentCardPlayer1 = null;
      this.currentCardPlayer2 = null;
    }
    this.cdRef.detectChanges();
    if (this.autoScrollEnabled) {
      this.scrollToBottom();
    }
  }

  scrollToBottom(): void {
    try {
      this.historyContainer.nativeElement.scrollTop = this.historyContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error("Erreur lors du scrolling automatique de l'historique", err);
    }
  }

  onHistoryScroll(): void {
    const element = this.historyContainer.nativeElement;
    const atBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 10;
    this.autoScrollEnabled = atBottom;
  }

  toggleAutoScroll(): void {
    this.autoScrollEnabled = !this.autoScrollEnabled;
    if (this.autoScrollEnabled) {
      this.scrollToBottom();
    }
  }

  startAutoPlay(): void {
    if (this.autoPlayInterval || this.gameService.getGameOverMessage() || !this.cardsDistributed) {
      return;
    }
    this.autoPlayInterval = setInterval(() => {
      this.drawCard(this.currentTurn);
    }, 1);
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
    this.cdRef.detectChanges();
  }

  closeRules(): void {
    this.rulesModalOpen = false;
  }

  restartGame(): void {
    this.stopAutoPlay();
    this.cardsDistributed = false;
    this.gameOverMessage = '';
    this.winnerDeclared = ''; // Réinitialiser le nom du gagnant
    this.currentTurn = 1;
    this.currentCardPlayer1 = null;
    this.currentCardPlayer2 = null;
    this.gameEnded = false;
    this.cdRef.detectChanges();
  }

  getCardColorClass(suit: string): string {
    return (suit === '♥' || suit === '♦') ? 'red-border' : 'black-border';
  }

  getHistory() {
    return this.gameService.getHistory();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }
}
