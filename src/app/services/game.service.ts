import { Injectable } from '@angular/core';
import { Card } from '../core/card.model';
import { Deck } from '../core/deck.model';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private playerDecks: { [key: number]: Card[] } = { 1: [], 2: [] };
  private tableCards: Card[] = [];
  private history: Array<{
    round: number;
    player1Cards: Card[];
    player2Cards: Card[];
    winner: string;
    player1Total: number;
    player2Total: number;
  }> = [];
  private roundCounter: number = 0;
  private gameOver: boolean = false;
  private gameOverMessage: string = '';
  private readonly maxRounds: number = 3000;

  constructor() {
    this.startGame();
  }

  startGame(): void {
    this.resetGameState();
    const deck = new Deck();
    deck.melanger();

    const shuffledCards = deck.distribuer();
    this.playerDecks[1] = shuffledCards.slice(0, 26);
    this.playerDecks[2] = shuffledCards.slice(26, 52);

    this.checkTotalCards();
  }

  private resetGameState(): void {
    this.playerDecks = { 1: [], 2: [] };
    this.tableCards = [];
    this.history = [];
    this.roundCounter = 0;
    this.gameOver = false;
    this.gameOverMessage = '';
  }

  drawCard(player: number): Card | null {
    if (this.playerDecks[player].length === 0 || this.gameOver) return null;

    const card = this.playerDecks[player].shift();
    if (!card) {
      return null;
    }
    this.tableCards.push(card);
    this.checkTotalCards();
    return card;
  }

  playRound(player1Card: Card, player2Card: Card): string {
    if (this.gameOver) return this.gameOverMessage;

    this.roundCounter++;

    if (this.roundCounter >= this.maxRounds) {
      this.determineWinner(true);
      return this.gameOverMessage;
    }

    const comparison = player1Card.compareTo(player2Card);
    let roundResult = '';

    if (comparison > 0) {
      this.collectCards(1);
      roundResult = `Manche ${this.roundCounter}: Joueur 1 gagne avec ${player1Card.value} contre ${player2Card.value}.`;
      this.addHistory(this.roundCounter, [player1Card], [player2Card], 'Joueur 1');
    } else if (comparison < 0) {
      this.collectCards(2);
      roundResult = `Manche ${this.roundCounter}: Joueur 2 gagne avec ${player2Card.value} contre ${player1Card.value}.`;
      this.addHistory(this.roundCounter, [player1Card], [player2Card], 'Joueur 2');
    } else {
      roundResult = `Manche ${this.roundCounter}: Bataille avec ${player1Card.value} contre ${player2Card.value}.`;
      this.handleBattle([player1Card], [player2Card]);
    }

    this.checkTotalCards();

    if (this.isGameOver()) {
      this.determineWinner();
    }

    return roundResult;
  }

  private handleBattle(player1CardsPlayed: Card[], player2CardsPlayed: Card[]): void {
    let battleWinner: string | null = null;

    while (battleWinner === null && !this.gameOver) {
      if (this.playerDecks[1].length < 2 || this.playerDecks[2].length < 2) {
        this.distributeRemainingCards(player1CardsPlayed, player2CardsPlayed);
        return;
      }

      this.addBattleCards(player1CardsPlayed, player2CardsPlayed);

      const comparison = player1CardsPlayed[player1CardsPlayed.length - 1].compareTo(
        player2CardsPlayed[player2CardsPlayed.length - 1]
      );

      battleWinner = this.resolveBattle(comparison, player1CardsPlayed, player2CardsPlayed);

      this.checkTotalCards();
    }

    this.addHistory(this.roundCounter, player1CardsPlayed, player2CardsPlayed, battleWinner!);
  }

  private addBattleCards(player1CardsPlayed: Card[], player2CardsPlayed: Card[]): void {
    const player1HiddenCard = this.drawCard(1);
    const player2HiddenCard = this.drawCard(2);

    const newPlayer1Card = this.drawCard(1);
    const newPlayer2Card = this.drawCard(2);

    if (newPlayer1Card && newPlayer2Card) {
      player1CardsPlayed.push(player1HiddenCard!, newPlayer1Card);
      player2CardsPlayed.push(player2HiddenCard!, newPlayer2Card);
    } else {
      this.handleBattleError();
    }
  }

  private resolveBattle(comparison: number, player1CardsPlayed: Card[], player2CardsPlayed: Card[]): string | null {
    if (comparison > 0) {
      this.playerDecks[1].push(...player1CardsPlayed, ...player2CardsPlayed);
      this.tableCards = [];
      this.checkTotalCards();
      return 'Joueur 1';
    } else if (comparison < 0) {
      this.playerDecks[2].push(...player1CardsPlayed, ...player2CardsPlayed);
      this.tableCards = [];
      this.checkTotalCards();
      return 'Joueur 2';
    }
    return null;
  }

  private handleBattleError(): void {
    this.gameOver = true;
    this.gameOverMessage = "Erreur lors de la bataille. Jeu interrompu.";
  }

  private collectCards(playerNumber: number): void {
    if (this.tableCards.length > 0) {
      this.playerDecks[playerNumber].push(...this.tableCards);
      this.tableCards = [];
      this.checkTotalCards();
    }
  }

  private distributeRemainingCards(player1CardsPlayed: Card[], player2CardsPlayed: Card[]): void {
    this.tableCards.push(...player1CardsPlayed, ...player2CardsPlayed);
    this.gameOver = true;
    this.gameOverMessage = `Un des joueurs n'a pas assez de cartes pour continuer la bataille. La partie est terminée.`;
    this.addHistory(this.roundCounter, player1CardsPlayed, player2CardsPlayed, 'Aucun');
    this.checkTotalCards();
  }

  private checkTotalCards(): void {
    const totalCards = this.playerDecks[1].length + this.playerDecks[2].length + this.tableCards.length;
    if (totalCards !== 52) {
      // Handle error
    }
  }

  private addHistory(round: number, player1Cards: Card[], player2Cards: Card[], winner: string): void {
    this.history.push({
      round,
      player1Cards: [...player1Cards],
      player2Cards: [...player2Cards],
      winner,
      player1Total: this.playerDecks[1].length,
      player2Total: this.playerDecks[2].length,
    });
  }

  private determineWinner(maxRoundsReached: boolean = false): void {
    const player1Cards = this.playerDecks[1].length;
    const player2Cards = this.playerDecks[2].length;

    if (this.tableCards.length === 0) {
      this.gameOver = true;

      if (player1Cards > player2Cards) {
        this.gameOverMessage = maxRoundsReached
          ? `La limite de tours est atteinte. Joueur 1 gagne avec ${player1Cards} cartes contre ${player2Cards}.`
          : 'Joueur 1 a remporté toutes les cartes et gagne la partie !';
      } else if (player2Cards > player1Cards) {
        this.gameOverMessage = maxRoundsReached
          ? `La limite de tours est atteinte. Joueur 2 gagne avec ${player2Cards} cartes contre ${player1Cards}.`
          : 'Joueur 2 a remporté toutes les cartes et gagne la partie !';
      } else {
        this.gameOverMessage = 'La partie se termine sur une égalité parfaite !';
      }
    }
  }

  getPlayerDeckSizes(): { player1: number; player2: number } {
    return {
      player1: this.playerDecks[1].length,
      player2: this.playerDecks[2].length,
    };
  }

  getPlayerDeck(player: number): Card[] {
    return this.playerDecks[player];
  }

  getHistory() {
    return this.history;
  }

  isGameOver(): boolean {
    return this.gameOver;
  }

  getGameOverMessage(): string {
    return this.gameOverMessage;
  }

  getWinner(): string {
    if (this.playerDecks[1].length > this.playerDecks[2].length) {
      return 'Joueur 1';
    } else if (this.playerDecks[2].length > this.playerDecks[1].length) {
      return 'Joueur 2';
    } else {
      return 'Égalité';
    }
  }
}
