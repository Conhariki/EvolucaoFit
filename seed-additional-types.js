const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const typesToRemove = [
        'Bíceps',
        'Coxa',
        'Panturrilha'
    ];

    const typesToAdd = [
        'Bíceps Esquerdo', 'Bíceps Direito',
        'Antebraço Esquerdo', 'Antebraço Direito',
        'Coxa Esquerda', 'Coxa Direita', // Girths
        'Panturrilha Esquerda', 'Panturrilha Direita',
        'Peitoral' // Keep generic
    ];

    console.log('Start refining girth types...');

    // Cleanup generic types
    for (const type of typesToRemove) {
        const existing = await prisma.measurementType.findFirst({ where: { name: type } });
        if (existing) {
            try {
                // Delete related values first to avoid constraint errors
                await prisma.measurementValue.deleteMany({ where: { typeId: existing.id } });
                await prisma.measurementType.delete({ where: { id: existing.id } });
                console.log(`Deleted generic: ${type}`);
            } catch (e) {
                console.log(`Error deleting ${type}: ${e.message}`);
            }
        }
    }

    // Add specific types
    for (const type of typesToAdd) {
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
