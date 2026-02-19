const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const typesToCreate = [
        { name: 'Pescoço', description: 'Circunferência do pescoço (Necessário para % de Gordura)' },
        { name: 'Cintura', description: 'Circunferência da cintura (Necessário para % de Gordura)' },
        { name: 'Quadril', description: 'Circunferência do quadril (Necessário para mulheres)' },
        { name: 'Peito', description: 'Circunferência do peitoral' },
        { name: 'Bíceps', description: 'Circunferência do braço contraído' },
        { name: 'Coxas', description: 'Circunferência da coxa' },
        { name: 'Panturrilha', description: 'Circunferência da panturrilha' },
    ];

    console.log('Verificando tipos de medidas...');

    for (const type of typesToCreate) {
        const existing = await prisma.measurementType.findFirst({
            where: { name: type.name },
        });

        if (!existing) {
            console.log(`Criando: ${type.name}`);
            await prisma.measurementType.create({
                data: type,
            });
        } else {
            console.log(`Já existe: ${type.name}`);
        }
    }

    console.log('Concluído!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
