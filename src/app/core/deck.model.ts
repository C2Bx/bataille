import { Card } from './card.model';

export class Deck {
  private cards: Card[] = [];

  constructor() {
    this.initializeDeck();
  }

  private initializeDeck(): void {
    const suits = ['♠', '♣', '♥', '♦'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    this.cards = [];

    for (const suit of suits) {
      for (const value of values) {
        this.cards.push(new Card(value, suit));
      }
    }
  }

  public melanger(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  public distribuer(): Card[] {
    return this.cards;
  }

  public piocher(): Card | undefined {
    return this.cards.shift();
  }

  get longueur(): number {
    return this.cards.length;
  }

  public setCards(cards: Card[]): void {
    this.cards = cards;
  }
}
