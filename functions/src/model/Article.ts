export class Article {
    id: string
    username: string
    description: string
    time_stamp: Date
    image_url: string

    constructor (id: string, username: string, description: string, time_stamp: Date, image_url: string) {
        this.id = id
        this.username = username
        this.description = description
        this.time_stamp = time_stamp
        this.image_url = image_url
    }

    public getImageUrl (): string {
        return this.image_url
    }
}