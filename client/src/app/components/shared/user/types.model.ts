export interface User {
    first_name: string;
    last_name?: string;
    email: string;
    phone: string;
}

export interface RegisterResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}