
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const prisma = new PrismaClient();

async function restore() {
    console.log('Restoring data to Postgres & Cloudinary...');

    const backupPath = path.join(process.cwd(), 'backup_data.json');
    if (!fs.existsSync(backupPath)) {
        console.error('Backup file not found at:', backupPath);
        return;
    }

    const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    // 1. Restore Users
    console.log(`Restoring ${data.users.length} users...`);
    for (const user of data.users) {
        const exists = await prisma.user.findUnique({ where: { id: user.id } });
        if (!exists) {
            await prisma.user.create({ data: user });
        }
    }

    // 2. Restore Measurement Types
    console.log(`Restoring ${data.measurementTypes.length} measurement types...`);
    for (const type of data.measurementTypes) {
        const exists = await prisma.measurementType.findUnique({ where: { id: type.id } });
        if (!exists) {
            await prisma.measurementType.create({ data: type });
        }
    }

    // 3. Restore Measurements
    console.log(`Restoring ${data.measurements.length} measurements...`);
    for (const measurement of data.measurements) {
        const exists = await prisma.measurement.findUnique({ where: { id: measurement.id } });
        if (!exists) {
            await prisma.measurement.create({ data: measurement });
        }
    }

    // 4. Restore Measurement Values
    console.log(`Restoring ${data.measurementValues.length} measurement values...`);
    for (const value of data.measurementValues) {
        const exists = await prisma.measurementValue.findUnique({ where: { id: value.id } });
        if (!exists) {
            await prisma.measurementValue.create({ data: value });
        }
    }

    // 5. Restore Photos (Upload to Cloudinary)
    console.log(`Processing ${data.photos.length} photos...`);
    for (const photo of data.photos) {
        const existing = await prisma.photo.findUnique({ where: { id: photo.id } });

        let finalUrl = photo.url;
        let needsUpload = false;

        // Check if we need to upload
        // If it's a local path, we definitely need to upload.
        // If it exists in DB but is local, we need to upload and update.
        // If it doesn't exist, we upload and create.

        if (photo.url.startsWith('/uploads')) {
            // Check if already uploaded in existing record?
            if (existing && !existing.url.startsWith('/uploads')) {
                // Already uploaded in DB
                finalUrl = existing.url;
            } else {
                needsUpload = true;
            }
        }

        if (needsUpload) {
            const localPath = path.join(process.cwd(), 'public', photo.url);
            if (fs.existsSync(localPath)) {
                console.log(`Uploading ${photo.url} to Cloudinary...`);
                try {
                    const result = await cloudinary.uploader.upload(localPath, {
                        folder: 'evolucao-fit/photos',
                        public_id: `${photo.userId}-${new Date(photo.date).getTime()}`,
                        resource_type: 'image'
                    });
                    finalUrl = result.secure_url;
                } catch (err) {
                    console.error(`Failed to upload ${photo.url}:`, err.message);
                    // If upload fails, we keep local URL, but it won't work in prod.
                }
            } else {
                console.warn(`File not found locally: ${localPath}`);
            }
        }

        if (existing) {
            if (existing.url !== finalUrl) {
                console.log(`Updating photo ${photo.id} URL...`);
                await prisma.photo.update({
                    where: { id: photo.id },
                    data: { url: finalUrl }
                });
            }
        } else {
            console.log(`Creating photo ${photo.id}...`);
            await prisma.photo.create({
                data: {
                    ...photo,
                    url: finalUrl
                }
            });
        }
    }

    console.log('Restore/Migration completed successfully!');
}

restore()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
