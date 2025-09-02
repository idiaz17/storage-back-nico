import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";

export const createUser = async (
    username: string,
    email: string,
    password: string,
    role: string = "user"
) => {
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
        data: {
            username,
            email,
            password: hashedPassword,
            role,
        },
    });

    return user;
};

export const findUserByEmail = async (email: string) => {
    return prisma.user.findUnique({
        where: { email },
    });
};

export const validatePassword = async (
    password: string,
    hashedPassword: string
) => {
    return bcrypt.compare(password, hashedPassword);
};
