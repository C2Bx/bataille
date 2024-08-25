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
  winnerDeclared: string = '';
  rulesModalOpen: boolean = false;
  gameEnded: boolean = false;
  cardsDistributed: boolean = false;
  autoScrollEnabled: boolean = true;

  @ViewChild('historyContainer', { static: false }) historyContainer!: ElementRef;

  constructor(public gameService: GameService, private cdRef: ChangeDetectorRef) {}

  distributeCards(): void {
    this.resetGame();
    this.gameService.startGame();
    this.cardsDistributed = true;
    this.updateView();
  }

  drawCard(player: number): void {
    if (!this.cardsDistributed || this.gameEnded) return;

    if (player === 1 && this.currentTurn === 1) {
      this.handlePlayer1Turn();
    } else if (player === 2 && this.currentTurn === 2) {
      this.handlePlayer2Turn();
    }

    this.updateViewAndScroll();
  }

  private handlePlayer1Turn(): void {
    if (this.currentCardPlayer1 && this.currentCardPlayer2) {
      this.resolveRound();
    }
    this.currentCardPlayer1 = this.gameService.drawCard(1);
    this.currentTurn = 2;
  }

  private handlePlayer2Turn(): void {
    this.currentCardPlayer2 = this.gameService.drawCard(2);
    this.currentTurn = 1;
  }

  resolveRound(): void {
    if (this.currentCardPlayer1 && this.currentCardPlayer2) {
      this.battleMessage = this.gameService.playRound(this.currentCardPlayer1, this.currentCardPlayer2);

      if (this.gameService.isGameOver()) {
        this.endGame();
      }

      this.currentCardPlayer1 = null;
      this.currentCardPlayer2 = null;
    }
    this.updateViewAndScroll();
  }

  scrollToBottom(): void {
    if (this.historyContainer) {
      this.historyContainer.nativeElement.scrollTop = this.historyContainer.nativeElement.scrollHeight;
    }
  }

  onHistoryScroll(): void {
    const element = this.historyContainer.nativeElement;
    this.autoScrollEnabled = element.scrollTop + element.clientHeight >= element.scrollHeight - 10;
  }

  toggleAutoScroll(): void {
    this.autoScrollEnabled = !this.autoScrollEnabled;
    if (this.autoScrollEnabled) {
      this.scrollToBottom();
    }
  }

  startAutoPlay(): void {
    if (this.autoPlayInterval || this.gameEnded || !this.cardsDistributed) return;

    this.autoPlayInterval = setInterval(() => {
      this.drawCard(this.currentTurn);
      if (this.gameService.isGameOver()) {
        this.stopAutoPlay();
      }
    }, 100);
  }

  stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  toggleAutoPlay(): void {
    this.autoPlayInterval ? this.stopAutoPlay() : this.startAutoPlay();
  }

  openRules(): void {
    this.rulesModalOpen = true;
    this.updateView();
  }

  closeRules(): void {
    this.rulesModalOpen = false;
  }

  restartGame(): void {
    this.stopAutoPlay();
    this.resetGame();
    this.updateView();
  }

  getCardColorClass(suit: string): string {
    return suit === '♥' || suit === '♦' ? 'red-border' : 'black-border';
  }

  getHistory() {
    return this.gameService.getHistory();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  private resetGame(): void {
    this.cardsDistributed = false;
    this.gameEnded = false;
    this.gameOverMessage = '';
    this.winnerDeclared = '';
    this.currentTurn = 1;
    this.currentCardPlayer1 = null;
    this.currentCardPlayer2 = null;
  }

  private endGame(): void {
    this.stopAutoPlay();
    this.gameEnded = true;
    this.gameOverMessage = this.gameService.getGameOverMessage();
    this.winnerDeclared = this.gameService.getWinner();
  }

  private updateView(): void {
    this.cdRef.detectChanges();
  }

  private updateViewAndScroll(): void {
    this.updateView();
    if (this.autoScrollEnabled) {
      this.scrollToBottom();
    }
  }
}
