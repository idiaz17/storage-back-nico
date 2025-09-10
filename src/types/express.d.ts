import { User } from "@prisma/client"; // or your own user type

declare global {
    namespace Express {
        interface UserPayload {
            id: number;
            role: string;
            clientId?: number | null;
            username?: string;
            email?: string;
        }

        // Extend the Request object to include `user`
        interface Request {
            user?: UserPayload;
        }
    }
}