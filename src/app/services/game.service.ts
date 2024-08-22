import { Injectable } from '@angular/core';
import { Card } from '../core/card.model';
import { Deck } from '../core/deck.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private deck: Deck = new Deck();
  private player1Deck: Card[] = [];
  private player2Deck: Card[] = [];
  private tableCards: Card[] = [];
  private battleMessage: string = '';
  private currentCardPlayer1: Card | null = null;
  private currentCardPlayer2: Card | null = null;
  private history: any[] = [];
  private roundCounter: number = 0;
  private gameOverMessage: string = '';
  private combinedMessage: string = '';

  constructor() {
    this.startGame();
  }

  startGame(): void {
    this.deck = new Deck();
    this.deck.melanger();
    this.player1Deck = [];
    this.player2Deck = [];
    this.tableCards = [];
    this.currentCardPlayer1 = null;
    this.currentCardPlayer2 = null;
    this.history = [];
    this.roundCounter = 0;
    this.gameOverMessage = '';
    this.combinedMessage = '';

    while (this.deck.longueur > 0) {
      this.player1Deck.push(this.deck.distribuer()!);
      if (this.deck.longueur > 0) this.player2Deck.push(this.deck.distribuer()!);
    }

    // Vérification que le total des cartes est bien 52
    const totalCards = this.player1Deck.length + this.player2Deck.length;
    if (totalCards !== 52) {
      console.error(`Erreur: le nombre total de cartes distribué n'est pas égal à 52. Total actuel: ${totalCards}`);
    }
  }

  drawCard(player: number): Card | null {
    if (player === 1 && this.player1Deck.length > 0) {
      this.currentCardPlayer1 = this.player1Deck.shift() || null;
      return this.currentCardPlayer1;
    } else if (player === 2 && this.player2Deck.length > 0) {
      this.currentCardPlayer2 = this.player2Deck.shift() || null;
      return this.currentCardPlayer2;
    }
    return null;
  }

  playRound(): string {
    if (this.currentCardPlayer1 && this.currentCardPlayer2) {
      this.roundCounter++;
      this.tableCards.push(this.currentCardPlayer1, this.currentCardPlayer2); // Ajoute les cartes sur la table

      let winner: string = '';
      while (this.currentCardPlayer1.compareTo(this.currentCardPlayer2) === 0) {
        // Bataille
        this.battleMessage = "Bataille!";

        if (this.player1Deck.length < 2 || this.player2Deck.length < 2) {
          winner = this.player1Deck.length > this.player2Deck.length ? 'Joueur 1' : 'Joueur 2';
          break;
        }

        // Chaque joueur pose une carte face cachée
        this.tableCards.push(this.player1Deck.shift()!, this.player2Deck.shift()!);

        // Puis une nouvelle carte face visible
        this.currentCardPlayer1 = this.player1Deck.shift()!;
        this.currentCardPlayer2 = this.player2Deck.shift()!;
        this.tableCards.push(this.currentCardPlayer1, this.currentCardPlayer2);
      }

      if (winner === '') {
        if (this.currentCardPlayer1.compareTo(this.currentCardPlayer2) > 0) {
          winner = 'Joueur 1';
          this.player1Deck.push(...this.tableCards);
        } else {
          winner = 'Joueur 2';
          this.player2Deck.push(...this.tableCards);
        }
      } else {
        // Si un gagnant est déterminé (un joueur a plus de cartes), il récupère toutes les cartes restantes
        if (winner === 'Joueur 1') {
          this.player1Deck.push(...this.tableCards);
        } else {
          this.player2Deck.push(...this.tableCards);
        }
      }

      this.history.push({
        round: this.roundCounter,
        player1Cards: [...this.tableCards.filter((_, i) => i % 2 === 0)],
        player2Cards: [...this.tableCards.filter((_, i) => i % 2 !== 0)],
        winner: winner,
        player1Total: this.player1Deck.length,
        player2Total: this.player2Deck.length,
      });

      // Vérification que le total des cartes reste 52
      const totalCards = this.player1Deck.length + this.player2Deck.length;
      if (totalCards !== 52) {
        console.error(`Erreur : Le total des cartes n'est pas égal à 52 après le tour. Total actuel: ${totalCards}`);
      }

      this.currentCardPlayer1 = null;
      this.currentCardPlayer2 = null;

      // Vérifier si l'un des joueurs n'a plus de cartes pour arrêter le jeu
      if (this.player1Deck.length === 0 || this.player2Deck.length === 0) {
        this.gameOverMessage = `${winner} a gagné la partie!`;
      }

      this.tableCards = []; // Réinitialiser les cartes sur la table après chaque tour

      return winner === 'Bataille' ? 'Bataille' : `Tour remporté par ${winner}`;
    }
    return '';
  }

  getScores(): { player1: number, player2: number } {
    return { player1: this.player1Deck.length, player2: this.player2Deck.length };
  }

  getCurrentCardPlayer1(): Card | null {
    return this.currentCardPlayer1;
  }

  getCurrentCardPlayer2(): Card | null {
    return this.currentCardPlayer2;
  }

  getBattleMessage(): string {
    return this.battleMessage;
  }

  getTableCards(): Card[] {
    return this.tableCards;
  }

  getHistory(): any[] {
    return this.history;
  }

  getGameOverMessage(): string {
    return this.gameOverMessage;
  }

  getCombinedMessage(): string {
    return this.combinedMessage;
  }

  getPlayerDeck(player: number): Card[] {
    return player === 1 ? this.player1Deck : this.player2Deck;
  }
}
