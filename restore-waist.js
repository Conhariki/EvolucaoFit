const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const typeName = 'Cintura';

    const existing = await prisma.measurementType.findFirst({
        where: { name: typeName },
    });

    if (!existing) {
        await prisma.measurementType.create({
            data: {
                name: typeName,
            },
        });
        console.log(`Restored: ${typeName}`);
    } else {
        console.log(`Already exists: ${typeName}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
