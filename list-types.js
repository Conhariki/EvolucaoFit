const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const types = await prisma.measurementType.findMany();
    console.log('Existing Measurement Types:');
    types.forEach(t => console.log(`- ${t.name} (ID: ${t.id})`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
