import * as functions from 'firebase-functions';
import admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

let db = admin.firestore();
let timestamp = admin.firestore.Timestamp

export const add_event = functions.https.onRequest(async (request, response) => {
    console.log(request.rawBody)

    const data = request.body

    await db.collection('Event').add({
        title: data.title,
        event_leader: data.event_leader,
        assign_by: data.assign_by,
        created: timestamp.fromDate(new Date()),
        date: timestamp.fromDate(new Date(data.date)),
        description: data.description,
        selected_team: getArrayString(data.selected_team),
        organizers: getArrayString(data.organizers),
    }).then((ref: any) => {
        console.log('Added document with ID: ', ref.id);
    });

    response.status(200).send("200");
});

function getArrayString(str: string) {
    return str.substring(1, (str.length - 1)).split(",")
}