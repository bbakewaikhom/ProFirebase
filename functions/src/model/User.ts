export class User {
    display_name: string
    username: string
    email: string
    phone_number: string
    profile_image_url: string
    user_id: string
    user_type: string
    bio: string

    constructor(display_name: string, username: string, email: string, phone_number: string,
        profile_image_url: string, user_id: string, user_type: string, bio: string) {
        this.display_name = display_name
        this.username = username
        this.email = email
        this.phone_number = phone_number
        this.profile_image_url = profile_image_url
        this.user_id = user_id
        this.user_type = user_type
        this.bio = bio
    }
}