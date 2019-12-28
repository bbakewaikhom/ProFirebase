import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';

export class Investment {
    private investment_on: string;
    private amount: string;

    constructor(investment_on: string, amount: string) {
        this.investment_on = investment_on
        this.amount = amount
    }

    static fromDoc (doc: DocumentSnapshot){
        if (doc.exists) {
            return new Investment(doc.get('investment_on'), doc.get('ammount'));
        }
        return null;
    }

    public getInventmentOn(): string {
        return this.investment_on;
    }

    public getAmount(): string {
        return this.amount;
    }
}