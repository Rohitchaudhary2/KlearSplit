export interface CurrentUser {
    user_id: string;
    first_name: string;
    last_name: string | null;
    email: string;
    phone: string;
    image_url: string;
}