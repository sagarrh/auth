export interface registerDTO{
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    userAgent?: string;
}
export interface loginDTO{
    email: string;
    password: string;
    userAgent?: string;
}
