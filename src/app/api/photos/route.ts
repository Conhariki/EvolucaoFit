import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]/route';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { unlink } from 'fs/promises';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in POST photos:', session);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const angle = formData.get('angle') as string;
    const date = formData.get('date') as string;

    if (!file || !angle || !date) {
      return NextResponse.json(
        { error: 'Arquivo, ângulo e data são obrigatórios' },
        { status: 400 }
      );
    }

    // Gera um nome único para o arquivo
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Define o caminho para salvar o arquivo
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filePath = join(uploadDir, fileName);

    // Converte o arquivo para buffer e salva
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Salva a referência no banco de dados
    const photo = await prisma.photo.create({
      data: {
        userId: session.user.id,
        url: `/uploads/${fileName}`,
        angle,
        date: new Date(date),
      },
    });

    console.log('Foto criada:', photo);

    return NextResponse.json(photo);
  } catch (error) {
    console.error('Erro ao criar foto:', error);
    return NextResponse.json(
      { error: 'Erro ao criar foto', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in GET photos:', session);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const photos = await prisma.photo.findMany({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
    });

    console.log('Fotos encontradas:', photos);

    // Formata as datas antes de retornar
    const formattedPhotos = photos.map(photo => ({
      ...photo,
      date: photo.date.toISOString(),
    }));

    return NextResponse.json(formattedPhotos);
  } catch (error) {
    console.error('Erro ao buscar fotos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar fotos', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in DELETE photos:', session);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID da foto é obrigatório' },
        { status: 400 }
      );
    }

    // Verifica se a foto pertence ao usuário
    const existingPhoto = await prisma.photo.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingPhoto) {
      return NextResponse.json(
        { error: 'Foto não encontrada' },
        { status: 404 }
      );
    }

    // Remove o arquivo físico
    const filePath = join(process.cwd(), 'public', existingPhoto.url);
    try {
      await unlink(filePath);
    } catch (error) {
      console.error('Erro ao remover arquivo físico:', error);
    }

    // Remove do banco de dados
    await prisma.photo.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Foto excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir foto:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir foto', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in PUT photos:', session);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const angle = formData.get('angle') as string;
    const date = formData.get('date') as string;
    const id = formData.get('id') as string;

    if (!file || !angle || !date || !id) {
      return NextResponse.json(
        { error: 'Arquivo, ângulo, data e id são obrigatórios' },
        { status: 400 }
      );
    }

    // Verifica se a foto pertence ao usuário
    const existingPhoto = await prisma.photo.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingPhoto) {
      return NextResponse.json(
        { error: 'Foto não encontrada' },
        { status: 404 }
      );
    }

    // Remove o arquivo físico antigo
    const oldFilePath = join(process.cwd(), 'public', existingPhoto.url);
    try {
      await unlink(oldFilePath);
    } catch (error) {
      console.error('Erro ao remover arquivo antigo:', error);
    }

    // Gera um nome único para o novo arquivo
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filePath = join(uploadDir, fileName);

    // Converte o arquivo para buffer e salva
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Atualiza a referência no banco de dados
    const updatedPhoto = await prisma.photo.update({
      where: { id },
      data: {
        url: `/uploads/${fileName}`,
        angle,
        date: new Date(date),
      },
    });

    console.log('Foto atualizada:', updatedPhoto);

    return NextResponse.json(updatedPhoto);
  } catch (error) {
    console.error('Erro ao atualizar foto:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar foto', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 