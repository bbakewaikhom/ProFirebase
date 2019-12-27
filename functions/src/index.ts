import {Event} from './model/Event'

import * as functions from 'firebase-functions';
import admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

let db = admin.firestore();
let timestamp = admin.firestore.Timestamp

export const get_all_events = functions.https.onRequest(async (request, response) => {
    const eventRef = db.collection('Event')
    await eventRef.get().then(snapshot => {
        const result: Array<Event> = new Array<Event>();
        snapshot.forEach(doc => {
            const event_id: string = doc.id
            const assigned_by: string = doc.get('assigned_by')
            const created_on: Date = doc.get('created_on')
            const event_date: Date = doc.get('event_date')
            const description: string = doc.get('description')
            const event_leader: string = doc.get('event_leader')
            const event_title: string = doc.get('event_title')
            const investment_amount: string = doc.get('investment_amount')
            const investment_return: string = doc.get('investment_return')
            const organizers: string[] = doc.get('organizers')
            const selected_teams: string[] = doc.get('selected_teams')
            
            result.push(new Event(
                event_id,
                event_title,
                event_leader,
                assigned_by,
                created_on,
                event_date,
                description,
                investment_amount,
                investment_return,
                organizers,
                selected_teams
            ));

            // console.log(id)
            // console.log(assign_by)
            // console.log(created)
            // console.log(date)
            // console.log(description)
            // console.log(event_leader)
            // console.log(selected_team)
            // console.log(organizers)
            // console.log(title)
        });

        console.log(JSON.stringify(result))
        response.status(200).send(JSON.stringify(result))
    }).catch(error => {
        console.log('error: ' + error)
        response.status(400).send(error)
    });
    response.status(400).send('something went wrong!!')
});

export const add_event = functions.https.onRequest(async (request, response) => {
    console.log(request.rawBody)

    const data = request.body

    await db.collection('Event').add({
        event_title: data.event_title,
        event_leader: data.event_leader,
        assigned_by: data.assigned_by,
        created_on: timestamp.fromDate(new Date()),
        event_date: timestamp.fromDate(new Date(data.event_date)),
        description: data.description,
        selected_teams: getArrayString(data.selected_teams),
        organizers: getArrayString(data.organizers),
        investment_amount: '',
        investment_return: '',
    }).then((ref: any) => {
        console.log('Added document with ID: ', ref.id);
    });

    response.status(200).send("200");
});

function getArrayString(str: string) {
    return str.substring(1, (str.length - 1)).split(",")
}