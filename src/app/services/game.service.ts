import { Injectable } from '@angular/core';
import { Card } from '../core/card.model';
import { Deck } from '../core/deck.model';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private playerDecks: { [key: number]: Card[] } = { 1: [], 2: [] };
  private tableCards: Card[] = [];
  private history: { round: number, player1Cards: Card[], player2Cards: Card[], winner: string, player1Total: number, player2Total: number }[] = [];
  private roundCounter: number = 0;
  private gameOver: boolean = false;
  private gameOverMessage: string = '';
  private battleOngoing: boolean = false;

  // Nombre maximum de tours fixé à 3000
  private maxRounds: number = 3001;

  startGame(): void {
    this.gameOver = false;
    this.gameOverMessage = '';
    this.roundCounter = 0;
    this.history = [];
    this.tableCards = [];
    this.battleOngoing = false;

    const deck = new Deck();
    deck.melanger();

    this.playerDecks[1] = deck.distribuer().slice(0, 26);
    this.playerDecks[2] = deck.distribuer().slice(26, 52);
  }

  drawCard(player: number): Card | null {
    if (this.playerDecks[player].length === 0 || this.gameOver) {
      return null;
    }
    const card = this.playerDecks[player].shift()!;
    this.tableCards.push(card);
    return card;
  }

  getPlayerDeck(player: number): Card[] {
    return this.playerDecks[player];
  }

  getTableCards(): Card[] {
    return this.tableCards;
  }

  playRound(): string {
    if (this.gameOver) {
      return this.gameOverMessage;
    }

    if (this.tableCards.length < 2) {
        return 'Erreur : Pas assez de cartes sur la table pour résoudre la manche.';
    }

    this.roundCounter++;
    if (this.roundCounter >= this.maxRounds) {
      this.gameOver = true;
      this.checkGameOver();
      return this.gameOverMessage;
    }

    const player1CardsPlayed: Card[] = [this.tableCards[this.tableCards.length - 2]];
    const player2CardsPlayed: Card[] = [this.tableCards[this.tableCards.length - 1]];

    let winner = '';
    let resultMessage = '';

    if (player1CardsPlayed[0].compareTo(player2CardsPlayed[0]) > 0) {
        resultMessage = `Joueur 1 gagne cette manche (${this.tableCards.length} cartes)`;
        this.playerDecks[1].push(...this.tableCards);
        winner = 'Joueur 1';
    } else if (player1CardsPlayed[0].compareTo(player2CardsPlayed[0]) < 0) {
        resultMessage = `Joueur 2 gagne cette manche (${this.tableCards.length} cartes)`;
        this.playerDecks[2].push(...this.tableCards);
        winner = 'Joueur 2';
    } else {
        // Logique de bataille
        resultMessage = 'Bataille!';

        while (true) {
            if (this.playerDecks[1].length < 2 || this.playerDecks[2].length < 2) {
                this.gameOver = true;
                this.gameOverMessage = `Un des joueurs ne peut pas continuer la bataille. La partie est terminée.`;
                return this.gameOverMessage;
            }

            const hiddenCard1 = this.playerDecks[1].shift()!;
            const hiddenCard2 = this.playerDecks[2].shift()!;
            this.tableCards.push(hiddenCard1);
            this.tableCards.push(hiddenCard2);
            player1CardsPlayed.push(hiddenCard1);
            player2CardsPlayed.push(hiddenCard2);

            const newPlayer1Card = this.playerDecks[1].shift()!;
            const newPlayer2Card = this.playerDecks[2].shift()!;
            this.tableCards.push(newPlayer1Card);
            this.tableCards.push(newPlayer2Card);
            player1CardsPlayed.push(newPlayer1Card);
            player2CardsPlayed.push(newPlayer2Card);

            if (newPlayer1Card.compareTo(newPlayer2Card) > 0) {
                resultMessage += ` Joueur 1 gagne la bataille et prend les ${this.tableCards.length} cartes.`;
                this.playerDecks[1].push(...this.tableCards);
                winner = 'Joueur 1';
                break;
            } else if (newPlayer1Card.compareTo(newPlayer2Card) < 0) {
                resultMessage += ` Joueur 2 gagne la bataille et prend les ${this.tableCards.length} cartes.`;
                this.playerDecks[2].push(...this.tableCards);
                winner = 'Joueur 2';
                break;
            } else {
                resultMessage += ' Nouvelle bataille!';
            }
        }
    }

    this.history.push({
        round: this.roundCounter,
        player1Cards: player1CardsPlayed,
        player2Cards: player2CardsPlayed,
        winner: winner,
        player1Total: this.playerDecks[1].length,
        player2Total: this.playerDecks[2].length,
    });

    this.tableCards = []; // Effacer la table après la résolution de la manche ou bataille
    this.battleOngoing = false; // Réinitialise l'état de bataille
    this.checkGameOver();

    return resultMessage;
  }

  getHistory() {
    return this.history;
  }

  getGameOverMessage(): string {
    return this.gameOverMessage;
  }

  getScores() {
    return {
      player1: this.playerDecks[1].length,
      player2: this.playerDecks[2].length,
    };
  }

  private checkGameOver(): void {
    if (this.playerDecks[1].length === 0 || this.playerDecks[2].length === 0 || this.roundCounter >= this.maxRounds) {
      this.gameOver = true;

      if (this.roundCounter >= this.maxRounds) {
        // Déterminer le gagnant en fonction du nombre de cartes restantes
        if (this.playerDecks[1].length > this.playerDecks[2].length) {
          this.gameOverMessage = 'La limite de tours est atteinte. Le joueur 1 gagne la partie!';
        } else if (this.playerDecks[2].length > this.playerDecks[1].length) {
          this.gameOverMessage = 'La limite de tours est atteinte. Le joueur 2 gagne la partie!';
        } else {
          this.gameOverMessage = 'La limite de tours est atteinte. La partie est un match nul!';
        }
      } else {
        if (this.playerDecks[1].length > this.playerDecks[2].length) {
          this.gameOverMessage = 'Le joueur 1 gagne la partie!';
        } else if (this.playerDecks[2].length > this.playerDecks[1].length) {
          this.gameOverMessage = 'Le joueur 2 gagne la partie!';
        } else {
          this.gameOverMessage = 'La partie est un match nul!';
        }
      }
    }
  }
}
