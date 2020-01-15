import * as functions from 'firebase-functions';
import admin = require('firebase-admin');
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';

import { Event } from './model/Event'
import { Investment } from './model/Investment';
import { APIResponse } from './model/APIResponse';
import { Article } from './model/Article';
import { User } from './model/User';

admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
// const storage = admin.storage();
const timestamp = admin.firestore.Timestamp

export const remove_organizer_from_event = functions.https.onRequest(async (request, response) => {
    console.log(request.body.event_id)
    console.log(request.body.user_id)
    await db.collection('Event').doc(request.body.event_id).update({
        organizers: admin.firestore.FieldValue.arrayRemove(request.body.user_id)
    }).catch (error => {
        console.log(error)
        response.send('400')
    })
    response.send('200')
})

export const add_organizer_to_event = functions.https.onRequest(async (request, response) => {
    console.log(request.body.event_id)
    console.log(request.body.organizers_to_add)
    await db.collection('Event').doc(request.body.event_id).update({
        organizers: admin.firestore.FieldValue.arrayUnion(...getArrayString(request.body.organizers_to_add))
    }).catch (error => {
        console.log(error)
        response.send('400')
    })
    response.send('200')
})

export const get_users = functions.https.onRequest(async (request, response) => {
    await db.collection('User').get().then(snapshot => {
        const result: Array<User> = new Array<User>();
        snapshot.forEach(doc => {
            result.push(getUserFromDoc(doc))
        });

        console.log(JSON.stringify(result))
        response.status(200).send(JSON.stringify(result))
    }).catch(error => {
        console.log('error: ' + error)
        response.status(400).send(error)
    });
});

export const update_user_details = functions.https.onRequest(async (request, response) => {
    const user_id: string = request.body.user_id

    await db.collection('User').doc(user_id).update({
        bio: request.body.bio,
        display_name: request.body.display_name,
        phone_number: request.body.phone_number
    }).then(event => {
        console.log(event)
        return response.status(200).send('200')
    }).catch(error => {
        console.log(error)
        return response.status(400).send('400')
    })
})

export const get_user_details = functions.https.onRequest(async (request, response) => {
    const user_id: string = request.body.user_id
    console.log("User id: " + user_id)

    await db.collection('User').doc(user_id).get()
        .then(doc => {
            if (doc.exists) {
                const user: User = getUserFromDoc(doc)
                console.log(JSON.stringify(user))
                return response.status(200).send(JSON.stringify(user))
            }
            return response.status(404).send('Information not found')
        }).catch(error => {
            console.log(error)
            return response.status(400).send(error)
        });
});

function getUserFromDoc(doc: DocumentSnapshot): User {
    return new User(
        doc.get('display_name'),
        doc.get('username'),
        doc.get('email'),
        doc.get('phone_number'),
        doc.get('profile_image_url'),
        doc.get('user_id'),
        doc.get('user_type'),
        doc.get('bio'),
    );
}

export const on_create_user = functions.auth.user().onCreate(async (user) => {
    console.log('User login for the first time')
    const username: string = <string>user.displayName?.replace(/\s/g, '')
    await db.collection('User').doc(user.uid).set({
        display_name: user.displayName,
        username: username,
        email: user.email,
        email_verified: user.emailVerified,
        phone_number: user.phoneNumber,
        profile_image_url: user.photoURL,
        user_id: user.uid,
        user_type: 'guest',
        bio: '',
    }).then(ref => {
        console.log("user added: " + JSON.stringify(ref))
        return
    }).catch(error => {
        console.log(error)
        return
    })
});

// This deletes only article from "Article" without deleting the image from storage
export const delete_article = functions.https.onRequest(async (request, response) => {
    const apiResponse: APIResponse = new APIResponse()
    console.log(request.rawBody)

    await db.collection('Article').doc(request.body.article_id).delete()
        .then(doc => {
            apiResponse.setStatus('200')
            apiResponse.setMessage('article deleted')

            console.log(JSON.stringify(apiResponse))
            console.log(JSON.stringify(doc))
            response.send(JSON.stringify(apiResponse))
        })
        .catch(error => {
            apiResponse.setStatus('400')
            apiResponse.setMessage(error)

            console.log(JSON.stringify(apiResponse))
            response.send(JSON.stringify(apiResponse))
        })
});

export const get_all_articles = functions.https.onRequest(async (request, response) => {
    await db.collection('Article').get().then(snapshot => {
        const promises: any = []
        snapshot.forEach(async article_doc => {
            const article: Article = getArticleFromDoc(article_doc);
            const p = db.collection('User').doc(article.user_id).get().then(user_doc => {
                const user: User = getUserFromDoc(user_doc)
                article.setDisplayName(user.display_name)
                article.setAvatar(user.profile_image_url)
                return article
            })
            promises.push(p)
        })
        return Promise.all(promises)
    }).then(articles => {
        console.log(articles)
        response.send(JSON.stringify(articles))
    })
});

function getArticleFromDoc(doc: DocumentSnapshot): Article {
    const date: Date = doc.get('time_stamp')
    const str: string = JSON.stringify(date)
    const obj: TimeStamp = JSON.parse(str)

    return new Article(
        doc.id,
        doc.get('user_id'),
        doc.get('description'),
        obj._seconds.toString(),
        doc.get('image_url'),
        '',
        ''
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
    await db.collection('Event').doc(request.body.event_id).get()
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
    console.log(request.body.event_id)

    await db.collection('Event').doc(request.body.event_id).get()
        .then(async doc => {
            if (doc.exists) {
                let event = {} as Event
                await getEventFromDoc(doc).then(e => event = e)
                console.log(JSON.stringify(event))
                return response.status(200).send(JSON.stringify(event))
            }
            return response.status(404).send('Information not found')
        }).catch(error => {
            console.log(error)
            return response.status(400).send(error)
        });
});

async function getEventFromDoc(event_doc: DocumentSnapshot): Promise<Event> {
    const organizers_ids: string[] = event_doc.get('organizers')

    let event_leader: User = {} as User
    let assigned_by: User = {} as User
    let organizers: User[] = []
    const docRef: any[] = []

    docRef.push(db.doc('User/' + event_doc.get('event_leader')))
    docRef.push(db.doc('User/' + event_doc.get('assigned_by')))
    organizers_ids.forEach(org => docRef.push(db.doc('User/' + org)))

    await db.getAll(...docRef).then(docs => { 
        event_leader = getUserFromDoc(docs[0])
        assigned_by = getUserFromDoc(docs[1])
        for (let i=2; i<docs.length; i++) {
            organizers.push(getUserFromDoc(docs[i]))
        }
    })

    const event = new Event(
        event_doc.id,
        event_doc.get('event_title'),
        event_leader,
        assigned_by,
        getSecondFromDate(event_doc.get('created_on')),
        getSecondFromDate(event_doc.get('event_date')),
        event_doc.get('description'),
        event_doc.get('investment_amount'),
        event_doc.get('investment_return'),
        organizers,
        event_doc.get('selected_teams')
    )
    return event
}

function getSecondFromDate(date: Date): string {
    const str: string = JSON.stringify(date)
    const ts: TimeStamp = JSON.parse(str)
    return ts._seconds.toString()
}

export const get_all_events = functions.https.onRequest(async (request, response) => {
    const eventRef = db.collection('Event')
    await eventRef.get().then(snapshot => {
        const promises: any = []
        snapshot.forEach(async doc => promises.push(getEventFromDoc(doc)))
        return Promise.all(promises)
    }).then(events => {
        console.log(JSON.stringify(events))
        response.status(200).send(JSON.stringify(events))
    }).catch(error => {
        console.log('error: ' + error)
        response.status(400).send(error)
    });
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
    return str.substring(1, (str.length - 1)).split(",").map(s => s.trim())
}