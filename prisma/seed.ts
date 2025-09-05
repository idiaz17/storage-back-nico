import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    // Create an admin user
    const admin = await prisma.user.upsert({
        where: { email: "admin@storage.com" },
        update: {},
        create: {
            username: "Admin",
            email: "admin@storage.com",
            password: await bcrypt.hash("admin123", 10),
            role: "admin",
        },
    });

    // Create a client
    const client = await prisma.client.upsert({
        where: { email: "john@doe.com" },
        update: {},
        create: {
            name: "John Doe",
            email: "john@doe.com",
            phone: "555-1234",
        },
    });

    // Create a user account for that client
    const clientUser = await prisma.user.upsert({
        where: { email: "johnuser@doe.com" },
        update: {},
        create: {
            username: "JohnUser",
            email: "johnuser@doe.com",
            password: await bcrypt.hash("client123", 10),
            role: "user",
            clientId: client.id, // 👈 link this user to John Doe
        },
    });

    console.log("Seed complete 🚀");
    console.log({ admin, client, clientUser });
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
