const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const KEEP_TYPES = [
    'Pescoço',
    'Cintura',
    'Quadril',
    'Dobra Cutânea - Peitoral',
    'Dobra Cutânea - Axilar Média',
    'Dobra Cutânea - Tríceps',
    'Dobra Cutânea - Subescapular',
    'Dobra Cutânea - Abdominal',
    'Dobra Cutânea - Suprailíaca',
    'Dobra Cutânea - Coxa'
];

async function main() {
    const allTypes = await prisma.measurementType.findMany();

    for (const type of allTypes) {
        if (!KEEP_TYPES.includes(type.name)) {
            console.log(`Deleting unused type: ${type.name}`);
            try {
                await prisma.measurementType.delete({
                    where: { id: type.id }
                });
                console.log(`Deleted ${type.name}`);
            } catch (error) {
                console.error(`Failed to delete ${type.name}:`, error.message);
            }
        } else {
            console.log(`Keeping: ${type.name}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
