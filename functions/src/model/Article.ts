export class Article {
    article_id: string
    user_id: string
    description: string
    time_stamp: string
    image_url: string
    display_name: string
    avatar: string

    constructor (article_id: string, user_id: string, description: string, time_stamp: string,
        image_url: string, display_name: string, avatar: string) {
        this.article_id = article_id
        this.user_id = user_id
        this.description = description
        this.time_stamp = time_stamp
        this.image_url = image_url
        this.display_name = display_name
        this.avatar = avatar
    }

    public getImageUrl (): string {
        return this.image_url
    }

    public setDisplayName (display_name: string) {
        this.display_name = display_name
    }

    public setAvatar (avatar: string) {
        this.avatar = avatar
    }
}