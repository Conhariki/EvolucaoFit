const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const photos = await prisma.photo.findMany({
            take: -5, // Pegar as últimas 5
            include: { user: true }
        });

        console.log('--- Last 5 Photos ---');
        photos.forEach(p => {
            console.log({
                id: p.id,
                angle: p.angle,
                date: p.date.toISOString(),
                userId: p.userId,
                userName: p.user ? p.user.name : 'N/A'
            });
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
