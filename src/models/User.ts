import bcrypt from 'bcryptjs';

export interface User {
    id: number;
    username: string;
    email: string;
    password: string;
    role: string;
}

// In a real application, this would be a database model
export const users: User[] = [];

export const createUser = async (username: string, email: string, password: string, role: string = 'user') => {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user: User = {
        id: users.length + 1,
        username,
        email,
        password: hashedPassword,
        role
    };
    users.push(user);
    return user;
};

export const findUserByEmail = (email: string) => {
    return users.find(user => user.email === email);
};

export const validatePassword = async (password: string, hashedPassword: string) => {
    return await bcrypt.compare(password, hashedPassword);
};