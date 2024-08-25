export class Card {
    constructor(public value: string, public suit: string) {}
  
    public compareTo(otherCard: Card): number {
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const thisValueIndex = values.indexOf(this.value);
        const otherValueIndex = values.indexOf(otherCard.value);
        if (thisValueIndex > otherValueIndex) {
            return 1;
        } else if (thisValueIndex < otherValueIndex) {
            return -1;
        } else {
            return 0;
        }
    }
  }
  