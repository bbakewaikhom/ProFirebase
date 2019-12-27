export class Event {
    event_id: string;
    event_title: string;
    event_leader: string;
    assigned_by: string;
    created_on: Date;
    event_date: Date;
    description: string;
    investment_amount: string;
    investment_return: string;
    selected_teams: string[];
    organizers: string[];

    constructor (id: string, title: string, event_leader: string, assign_by: string, 
        created: Date, date: Date, description: string, investment_amount: string,
        investment_return: string, organizers: string[], selected_team: string[]) {
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