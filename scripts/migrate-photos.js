/**
 * Script para migrar fotos existentes do sistema de arquivos local para o Vercel Blob Storage
 * 
 * Como usar:
 * 1. Certifique-se de ter o token do Vercel Blob Storage em .env.local
 * 2. Execute: node scripts/migrate-photos.js
 */

const { PrismaClient } = require('@prisma/client');
const { put } = require('@vercel/blob');
const fs = require('fs/promises');
const path = require('path');
const { fileURLToPath } = require('url');

const prisma = new PrismaClient();

async function migratePhotos() {
  try {
    console.log('Iniciando migração de fotos para o Vercel Blob Storage...');

    // Buscar todas as fotos do banco de dados
    const photos = await prisma.photo.findMany();
    console.log(`Total de fotos encontradas: ${photos.length}`);

    // Diretório de uploads
    const uploadsDir = path.join(process.cwd(), 'public');

    let successCount = 0;
    let errorCount = 0;

    // Processar cada foto
    for (const photo of photos) {
      try {
        // Verificar se a URL já aponta para o Vercel Blob Storage
        if (photo.url.includes('vercel-storage.com')) {
          console.log(`Foto ${photo.id} já está no Blob Storage: ${photo.url}`);
          continue;
        }

        // Caminho para o arquivo local
        const localPath = path.join(uploadsDir, photo.url);
        
        try {
          // Verificar se o arquivo existe
          await fs.access(localPath);
        } catch (error) {
          console.error(`Arquivo não encontrado: ${localPath}`);
          errorCount++;
          continue;
        }

        // Ler o arquivo
        console.log(`Lendo arquivo: ${localPath}`);
        const fileData = await fs.readFile(localPath);
        
        // Extrair o nome do arquivo da URL
        const fileName = path.basename(photo.url);
        
        // Fazer upload para o Vercel Blob Storage
        console.log(`Fazendo upload de: ${fileName}`);
        const blob = await put(fileName, fileData, {
          access: 'public',
        });
        
        // Atualizar a URL no banco de dados
        await prisma.photo.update({
          where: { id: photo.id },
          data: { url: blob.url },
        });
        
        console.log(`Foto ${photo.id} migrada com sucesso: ${blob.url}`);
        successCount++;
        
      } catch (error) {
        console.error(`Erro ao migrar foto ${photo.id}:`, error);
        errorCount++;
      }
    }

    console.log('\nMigração concluída:');
    console.log(`- Total de fotos: ${photos.length}`);
    console.log(`- Migradas com sucesso: ${successCount}`);
    console.log(`- Erros: ${errorCount}`);

  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migratePhotos(); 