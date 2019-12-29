import * as functions from 'firebase-functions';
import admin = require('firebase-admin');
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';

import { Event } from './model/Event'
import { Investment } from './model/Investment';
import { APIResponse } from './model/APIResponse';
import { Article } from './model/Article';

admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
const timestamp = admin.firestore.Timestamp

export const get_all_articles = functions.https.onRequest(async (request, response) => {
    await db.collection('Article').get()
        .then(snapshot => {
            const result: Array<Article> = new Array<Article>();
            snapshot.forEach(doc => {
                result.push(getArticleFromDoc(doc))
            });
            
            response.send(JSON.stringify(result))
        }).catch(error => {
            response.send({
                status: 400,
                message: error
            })
        });
});

function getArticleFromDoc(doc: DocumentSnapshot): Article {
    return new Article(
        doc.id,
        doc.get('username'),
        doc.get('description'),
        doc.get('time_stamp'),
        doc.get('image_url'),
    );
}

export const delete_event = functions.https.onRequest(async (request, response) => {
    const apiResponse: APIResponse = new APIResponse()
    console.log(request.rawBody)

    await db.collection('Event').doc(request.body.event_id).delete()
        .catch(error => {
            apiResponse.setStatus('400')
            apiResponse.setMessage(error)

            console.log(JSON.stringify(apiResponse))
            response.send(JSON.stringify(apiResponse))
        })

    apiResponse.setStatus('200')
    apiResponse.setMessage('item deleted')

    console.log(JSON.stringify(apiResponse))
    response.send(JSON.stringify(apiResponse))
});

export const get_event_investment = functions.https.onRequest(async (request, response) => {
    await db.collection('Event').doc('oOUFMCSJ1mr2njMAUZER').get()
        .then(doc => {
            const investment_details: Investment[] = <Investment[]>JSON.parse(JSON.stringify(doc.get('investment_details')))
            const result = ({
                investment_details: investment_details,
                investment_amount: doc.get('investment_amount'),
                investment_return: doc.get('investment_return'),
            })

            console.log(JSON.stringify(result))
            console.log(investment_details)
            console.log(doc.get('investment_amount'))
            console.log(doc.get('investment_return'))
            return response.status(200).send(JSON.stringify(result))
        }).catch(error => {
            return response.status(400).send(error)
        });
});

export const add_investment_details = functions.https.onRequest(async (request, response) => {
    const body = request.body

    const investment_details: Investment[] = <Investment[]>JSON.parse(body.investment_details)

    console.log(investment_details)

    await db.collection('Event').doc(body.event_id).update({
        investment_details: investment_details,
        investment_amount: body.investment_amount,
        investment_return: body.investment_return,
    }).catch(error => {
        return response.status(400).send(error)
    })

    return response.status(200).send('200')
});

export const get_event_details = functions.https.onRequest(async (request, response) => {
    console.log(request.rawBody)

    await db.collection('Event').doc(request.body.event_id).get()
        .then(doc => {
            if (doc.exists) {
                console.log(JSON.stringify(getEventFromDoc(doc)))
                return response.status(200).send(JSON.stringify(getEventFromDoc(doc)))
            }
            return response.status(404).send('Information not found')
        }).catch(error => {
            return response.status(400).send(error)
        });
    // return response.status(400).send('something went wrong')
});

function getEventFromDoc(doc: DocumentSnapshot): Event {
    return new Event(
        doc.id,
        doc.get('event_title'),
        doc.get('event_leader'),
        doc.get('assigned_by'),
        doc.get('created_on'),
        doc.get('event_date'),
        doc.get('description'),
        doc.get('investment_amount'),
        doc.get('investment_return'),
        doc.get('organizers'),
        doc.get('selected_teams')
    );
}

export const get_all_events = functions.https.onRequest(async (request, response) => {
    const eventRef = db.collection('Event')
    await eventRef.get().then(snapshot => {
        const result: Array<Event> = new Array<Event>();
        snapshot.forEach(doc => {
            result.push(getEventFromDoc(doc))
        });

        console.log(JSON.stringify(result))
        response.status(200).send(JSON.stringify(result))
    }).catch(error => {
        console.log('error: ' + error)
        response.status(400).send(error)
    });
    // response.status(400).send('something went wrong!!')
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