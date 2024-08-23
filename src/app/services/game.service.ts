import { Injectable } from '@angular/core';
import { Card } from '../core/card.model';
import { Deck } from '../core/deck.model';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private playerDecks: { [key: number]: Card[] } = { 1: [], 2: [] };
  private tableCards: Card[] = [];
  private history: {
    round: number;
    player1Cards: Card[];
    player2Cards: Card[];
    winner: string;
    player1Total: number;
    player2Total: number;
  }[] = [];
  private roundCounter: number = 0;
  private gameOver: boolean = false;
  private gameOverMessage: string = '';
  private maxRounds: number = 1000;

  startGame(): void {
    this.resetGameState();

    const deck = new Deck();
    deck.melanger(); // Mélanger les cartes

    const shuffledCards = deck.distribuer(); // Distribuer les cartes mélangées
    this.playerDecks[1] = shuffledCards.slice(0, 26);
    this.playerDecks[2] = shuffledCards.slice(26, 52);

    this.checkTotalCards();
  }

  drawCard(player: number): Card | null {
    if (this.playerDecks[player].length === 0 || this.gameOver) {
      return null;
    }
    const card = this.playerDecks[player].shift()!;
    this.tableCards.push(card);
    return card;
  }

  playRound(): string {
    if (this.gameOver) {
      return this.gameOverMessage;
    }

    if (this.playerDecks[1].length === 0 || this.playerDecks[2].length === 0) {
      this.determineWinner();
      return this.gameOverMessage;
    }

    if (this.roundCounter >= this.maxRounds) {
      this.determineWinner(true);
      return this.gameOverMessage;
    }

    this.roundCounter++;

    const player1Card = this.drawCard(1);
    const player2Card = this.drawCard(2);

    if (!player1Card || !player2Card) {
      return 'Erreur: Une des cartes n\'a pas pu être tirée.';
    }

    let roundResult = '';

    const comparison = player1Card.compareTo(player2Card);

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
      this.handleBattle();
    }

    this.checkTotalCards();

    if (this.playerDecks[1].length === 0 || this.playerDecks[2].length === 0) {
      this.determineWinner();
    }

    return roundResult;
  }

  private handleBattle(): void {
    const player1CardsPlayed: Card[] = [];
    const player2CardsPlayed: Card[] = [];
    let battleWinner: string | null = null;

    while (true) {
        // Vérifiez si les joueurs ont suffisamment de cartes pour continuer la bataille
        if (this.playerDecks[1].length < 2 || this.playerDecks[2].length < 2) {
            this.gameOver = true;
            this.gameOverMessage = `Un des joueurs n'a pas assez de cartes pour continuer la bataille. La partie est terminée.`;
            this.addHistory(this.roundCounter, player1CardsPlayed.slice(), player2CardsPlayed.slice(), 'Aucun');
            return;
        }

        // Chaque joueur pose une carte face cachée (pot)
        const player1HiddenCard = this.drawCard(1)!;
        const player2HiddenCard = this.drawCard(2)!;
        player1CardsPlayed.push(player1HiddenCard);
        player2CardsPlayed.push(player2HiddenCard);

        // Chaque joueur révèle une nouvelle carte
        const newPlayer1Card = this.drawCard(1)!;
        const newPlayer2Card = this.drawCard(2)!;
        player1CardsPlayed.push(newPlayer1Card);
        player2CardsPlayed.push(newPlayer2Card);

        console.log(`Bataille: Joueur 1 joue ${newPlayer1Card.value}${newPlayer1Card.suit} et Joueur 2 joue ${newPlayer2Card.value}${newPlayer2Card.suit}`);

        const comparison = newPlayer1Card.compareTo(newPlayer2Card);

        if (comparison > 0) {
            // Joueur 1 gagne la bataille
            console.log('Joueur 1 gagne la bataille');
            this.playerDecks[1].push(...player1CardsPlayed, ...player2CardsPlayed);
            battleWinner = 'Joueur 1';
            break;
        } else if (comparison < 0) {
            // Joueur 2 gagne la bataille
            console.log('Joueur 2 gagne la bataille');
            this.playerDecks[2].push(...player1CardsPlayed, ...player2CardsPlayed);
            battleWinner = 'Joueur 2';
            break;
        } else {
            // Si égalité, on continue la bataille (ajoute les cartes égales et face cachée à l'historique)
            console.log('Nouvelle bataille');
        }
    }

    // Ajouter l'historique final de la bataille avec toutes les cartes jouées
    this.addHistory(this.roundCounter, player1CardsPlayed.slice(), player2CardsPlayed.slice(), battleWinner!);

    this.tableCards = []; // Vider la table après la bataille
    this.checkTotalCards(); // Vérifier le nombre total de cartes après la bataille
  }

  private collectCards(playerNumber: number): void {
    console.log(`Collecte des cartes pour Joueur ${playerNumber}`);
    console.log('Cartes sur la table:', this.tableCards.map(card => `${card.value}${card.suit}`).join(', '));

    if (this.tableCards.length > 0) {
      this.playerDecks[playerNumber].push(...this.tableCards);
      this.tableCards = []; // S'assurer que la table est vide après la collecte
    }

    this.checkTotalCards(); // Vérifier le nombre total de cartes après chaque collecte

    console.log(`Taille du paquet Joueur 1: ${this.playerDecks[1].length}`);
    console.log(`Taille du paquet Joueur 2: ${this.playerDecks[2].length}`);
  }

  private addHistory(round: number, player1Cards: Card[], player2Cards: Card[], winner: string): void {
    this.history.push({
      round: round,
      player1Cards: player1Cards.slice(),
      player2Cards: player2Cards.slice(),
      winner: winner,
      player1Total: this.playerDecks[1].length,
      player2Total: this.playerDecks[2].length,
    });
  }

  private checkTotalCards(): void {
    const totalCards = this.playerDecks[1].length + this.playerDecks[2].length;
    if (totalCards !== 52) {
      console.error(`Erreur: Nombre total de cartes incorrect (${totalCards} au lieu de 52).`);
    }
  }

  private determineWinner(maxRoundsReached: boolean = false): void {
    this.gameOver = true;

    const player1Cards = this.playerDecks[1].length;
    const player2Cards = this.playerDecks[2].length;

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

  private resetGameState(): void {
    this.playerDecks = { 1: [], 2: [] };
    this.tableCards = [];
    this.history = [];
    this.roundCounter = 0;
    this.gameOver = false;
    this.gameOverMessage = '';
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

  getPlayerDeckSizes(): { player1: number; player2: number } {
    return {
      player1: this.playerDecks[1].length,
      player2: this.playerDecks[2].length,
    };
  }

  getPlayerDeck(player: number): Card[] {
    return this.playerDecks[player];
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

  getHistoryDetails(): string {
    return this.history.map(entry => {
      return `Tour ${entry.round}: ${entry.winner} gagne. Cartes Joueur 1: ${entry.player1Cards.map(card => `${card.value}${card.suit}`).join(', ')}, Cartes Joueur 2: ${entry.player2Cards.map(card => `${card.value}${card.suit}`).join(', ')}. Total Joueur 1: ${entry.player1Total}, Total Joueur 2: ${entry.player2Total}`;
    }).join('\n');
  }
}
