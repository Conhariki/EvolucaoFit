const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const skinfoldTypes = [
        'Dobra Cutânea - Peitoral',
        'Dobra Cutânea - Axilar Média',
        'Dobra Cutânea - Tríceps',
        'Dobra Cutânea - Subescapular',
        'Dobra Cutânea - Abdominal',
        'Dobra Cutânea - Suprailíaca',
        'Dobra Cutânea - Coxa',
    ];

    console.log('Start seeding skinfold types...');

    for (const type of skinfoldTypes) {
        const existing = await prisma.measurementType.findFirst({
            where: { name: type },
        });

        if (!existing) {
            await prisma.measurementType.create({
                data: {
                    name: type,
                },
            });
            console.log(`Created: ${type}`);
        } else {
            console.log(`Already exists: ${type}`);
        }
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
