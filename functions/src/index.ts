import * as functions from 'firebase-functions';
import admin = require('firebase-admin');
const firebase_tools = require('firebase-tools');
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

const REF_USER: string = 'User'
const REF_ARTICLE: string = 'Article'
const REF_EVENT: string = 'Event'
const REF_SUB_REACTION: string = 'Reaction'

const ACTION_NONE: string = 'none'

export const get_reacted_users_on_article = functions.https.onRequest(async (request, response) => {
    const article_id: string = request.body.article_id

    const reactions: any = []
    await db.collection(REF_ARTICLE).doc(article_id).collection(REF_SUB_REACTION).get().then(snapshot => {
        const promises: any = []
        snapshot.forEach(doc => {
            promises.push(db.collection(REF_USER).doc(doc.id).get().then(userDoc => {
                reactions.push({
                    user: getUserFromDoc(userDoc),
                    reaction: doc.get('reaction')
                }) 
            }))
        })
        return Promise.all(promises)
    }).then(_ => {
        console.log(reactions)
        response.send(reactions)
    }).catch(error => {
        console.error(error)
        response.send('400')
    })
})
exports.on_delete_article = functions.firestore
    .document(REF_ARTICLE + '/{article_id}')
    .onDelete((snap, context) => {
        const deletedValue = snap.data();
        console.log('Execution onDelete article')
        console.log(deletedValue)
    });

export const get_article_details = functions.https.onRequest(async (request, response) => {
    const article_id: string = request.body.article_id
    const user_id: string = request.body.user_id

    await db.collection(REF_ARTICLE).doc(article_id).get().then(async doc => {
        if (doc.exists) {
            const article: Article = getArticleFromDoc(doc)
            await db.collection(REF_USER).doc(article.user_id).get().then(user_doc => {
                const user: User = getUserFromDoc(user_doc)
                article.setDisplayName(user.display_name)
                article.setAvatar(user.profile_image_url)
            })

            await db.collection(REF_ARTICLE).doc(article_id).collection(REF_SUB_REACTION).doc(user_id).get().then(reaction => {
                if (reaction.exists) {
                    article.setMyReaction(reaction.get('reaction'))
                } else {
                    article.setMyReaction(ACTION_NONE)
                }
            })
            response.send(JSON.stringify(article))
        } else {
            response.send('400')
        }
    }).catch(error => {
        console.error(error)
        response.send('400')
    })
})

export const on_article_reaction = functions.https.onRequest(async (request, response) => {
    const user_id: string = request.body.user_id
    const article_id: string = request.body.article_id
    const action: string = request.body.action

    const increment = admin.firestore.FieldValue.increment(1)
    const decrement = admin.firestore.FieldValue.increment(-1)
    const db_ref = db.collection(REF_ARTICLE).doc(article_id).collection(REF_SUB_REACTION).doc(user_id)

    await db_ref.get().then(async doc => {
        const promises: any = []
        if (doc.exists) {
            const existing_action: string = doc.get('reaction')
            if (existing_action == action) {
                await db.collection(REF_ARTICLE).doc(article_id).update({
                    reaction_count: decrement
                })
                promises.push(db_ref.delete())
            } else {
                promises.push(db_ref.update({
                    reaction: action
                }))
            }
        } else {
            await db.collection(REF_ARTICLE).doc(article_id).update({
                reaction_count: increment
            })
            promises.push(db_ref.set({
                reaction: action
            }))
        }
        return Promise.all(promises)
    }).then(_ => {
        response.send('200')
    })
        .catch(error => {
            console.error(error)
            response.send('400')
        })
})

export const update_account_type = functions.https.onRequest(async (request, response) => {
    const user_id: string = request.body.user_id
    const user_type: string = request.body.user_type

    await db.collection(REF_USER).doc(user_id).update({
        user_type: user_type
    }).then(ref => {
        console.log(ref)
        response.send('200')
    }).catch(error => {
        console.error(error)
        response.send('400')
    })
})

export const get_my_event = functions.https.onRequest(async (request, response) => {
    const user_id: string = request.body.user_id
    console.log(user_id)
    await db.collection(REF_EVENT).where('organizers', 'array-contains', user_id).get().then(snapshot => {
        const my_event: Promise<Event>[] = []
        snapshot.forEach(async doc => {
            my_event.push(getEventFromDoc(doc))
        })
        return Promise.all(my_event)
    }).then(events => {
        console.log(JSON.stringify(events))
        response.send(JSON.stringify(events))
    }).catch(error => {
        console.log(error)
        response.status(400).send('400')
    })
})

export const remove_organizer_from_event = functions.https.onRequest(async (request, response) => {
    console.log(request.body.event_id)
    console.log(request.body.user_id)
    await db.collection(REF_EVENT).doc(request.body.event_id).update({
        organizers: admin.firestore.FieldValue.arrayRemove(request.body.user_id)
    }).catch(error => {
        console.log(error)
        response.send('400')
    })
    response.send('200')
})

export const add_organizer_to_event = functions.https.onRequest(async (request, response) => {
    console.log(request.body.event_id)
    console.log(request.body.organizers_to_add)
    await db.collection(REF_EVENT).doc(request.body.event_id).update({
        organizers: admin.firestore.FieldValue.arrayUnion(...getArrayString(request.body.organizers_to_add))
    }).catch(error => {
        console.log(error)
        response.send('400')
    })
    response.send('200')
})

export const get_users = functions.https.onRequest(async (request, response) => {
    await db.collection(REF_USER).orderBy('display_name').get().then(snapshot => {
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

    await db.collection(REF_USER).doc(user_id).update({
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

    await db.collection(REF_USER).doc(user_id).get()
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

// TODO: Delete this method after BufferArticle is empty
export const recover_old_data = functions.auth.user().onCreate(async (user) => {
    console.log('recover old data')
    const email: string = <string>user.email

    await db.collection('BufferArticle').where('email', '==', email).get().then(snapshot => {
        const promises: any = []
        snapshot.forEach(doc => {
            const article = db.collection(REF_ARTICLE).doc(doc.id).set({
                user_id: user.uid,
                time_stamp: doc.get('time_stamp'),
                description: doc.get('description'),
                image_url: doc.get('image_url')
            })
            promises.push(article)
        })
        console.log('length: ' + snapshot.size)
        return Promise.all(promises)
    }).then(ref => {
        console.log('saved: ' + ref)
    }).catch(error => {
        console.error(error)
    })

    await db.collection('BufferArticle').where('email', '==', email).get().then(snapshot => {
        const promises: any = []
        snapshot.forEach(doc => {
            const deleted = doc.ref.delete()
            promises.push(deleted)
        })
        return Promise.all(promises)
    }).then(ref => {
        console.log('deleted: ' + ref)
    }).catch(error => {
        console.error(error)
    })
});

export const on_create_user = functions.auth.user().onCreate(async (user) => {
    console.log('User login for the first time')
    const username: string = <string>user.displayName?.replace(/\s/g, '')
    const email: string = <string>user.email
    let account_type: string = 'guest'

    // TODO: remove this part after BufferUser is empty
    await db.collection('BufferUser').doc(email).get().then(doc => {
        if (doc.exists) {
            account_type = doc.get('account_type')
            return
        }
    })

    await db.collection('BufferUser').doc(email).delete().then(doc => {
        console.log('deleted: ' + doc)
        return
    })
    // till this

    await db.collection(REF_USER).doc(user.uid).set({
        display_name: user.displayName,
        username: username,
        email: user.email,
        email_verified: user.emailVerified,
        phone_number: user.phoneNumber,
        profile_image_url: user.photoURL,
        user_id: user.uid,
        user_type: account_type,
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
    const path: string = REF_ARTICLE + '/' + request.body.article_id

    await firebase_tools.firestore.delete(path, {
        project: process.env.GCLOUD_PROJECT,
        recursive: true,
        yes: true,
    }).then((ref: any) => {
        console.log(ref)
        response.send('200')
    }).catch((error: any) => {
        console.error(error)
        response.send('400')
    })
});

export const get_all_articles = functions.https.onRequest(async (request, response) => {
    const user_id: string = request.body.user_id

    await db.collection(REF_ARTICLE).get().then(snapshot => {
        const promises: any = []
        snapshot.forEach(async article_doc => {
            const article: Article = getArticleFromDoc(article_doc);

            const p = db.collection(REF_USER).doc(article.user_id).get().then(async user_doc => {
                const user: User = getUserFromDoc(user_doc)
                article.setDisplayName(user.display_name)
                article.setAvatar(user.profile_image_url)

                await db.collection(REF_ARTICLE).doc(article_doc.id).collection(REF_SUB_REACTION).doc(user_id).get().then(reaction => {
                    if (reaction.exists) {
                        article.setMyReaction(reaction.get('reaction'))
                    } else {
                        article.setMyReaction(ACTION_NONE)
                    }
                })

                return article
            })
            promises.push(p)
        })
        return Promise.all(promises)
    }).then(articles => {
        console.log(articles)
        response.send(JSON.stringify(articles.reverse()))
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
        '',
        doc.get('reaction_count').toString()
    );
}

export const delete_event = functions.https.onRequest(async (request, response) => {
    const apiResponse: APIResponse = new APIResponse()
    console.log(request.rawBody)

    await db.collection(REF_EVENT).doc(request.body.event_id).delete()
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
    await db.collection(REF_EVENT).doc(request.body.event_id).get()
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

    await db.collection(REF_EVENT).doc(body.event_id).update({
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

    await db.collection(REF_EVENT).doc(request.body.event_id).get()
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
        for (let i = 2; i < docs.length; i++) {
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
    const eventRef = db.collection(REF_EVENT)
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

    await db.collection(REF_EVENT).add({
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