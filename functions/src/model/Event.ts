import { User } from './User';
export class Event {
    event_id: string;
    event_title: string;
    event_leader: User;
    assigned_by: User;
    created_on: string;
    event_date: string;
    description: string;
    investment_amount: string;
    investment_return: string;
    selected_teams: string[];
    organizers: User[];

    constructor (id: string, title: string, event_leader: User, assign_by: User, 
        created: string, date: string, description: string, investment_amount: string,
        investment_return: string, organizers: User[], selected_team: string[]) {
        this.event_id = id
        this.event_title = title
        this.event_leader = event_leader
        this.assigned_by = assign_by
        this.created_on = created
        this.event_date = date
        this.description = description
        this.organizers = organizers
        this.selected_teams = selected_team
        this.investment_amount = investment_amount
        this.investment_return = investment_return
    }
}