import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]/route';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
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
    const studentId = formData.get('studentId') as string | null;

    if (!file || !angle || !date) {
      return NextResponse.json(
        { error: 'Arquivo, ângulo e data são obrigatórios' },
        { status: 400 }
      );
    }

    // Determina o userId: se for professor e tiver studentId, usa o studentId; senão usa o próprio id
    let targetUserId = session.user.id;
    if (studentId && session.user.role === 'PROFESSOR') {
      // Verifica se o aluno pertence ao professor
      const student = await prisma.user.findFirst({
        where: {
          id: studentId,
          professorId: session.user.id,
        },
      });
      if (!student) {
        return NextResponse.json(
          { error: 'Aluno não encontrado ou não vinculado a este professor' },
          { status: 403 }
        );
      }
      targetUserId = studentId;
    }

    // Gera um nome único para o arquivo
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;

    // Define o caminho para salvar o arquivo
    const uploadDir = join(process.cwd(), 'public', 'uploads');

    // Garantir que o diretório existe
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = join(uploadDir, fileName);
    console.log('Tentando salvar arquivo em:', filePath);

    // Converte o arquivo para buffer e salva
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Salva a referência no banco de dados
    const photo = await prisma.photo.create({
      data: {
        userId: targetUserId,
        url: `/uploads/${fileName}`,
        angle: angle as any,
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

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    // Determina o userId: se for professor e tiver studentId, usa o studentId; senão usa o próprio id
    let targetUserId = session.user.id;
    if (studentId && session.user.role === 'PROFESSOR') {
      // Verifica se o aluno pertence ao professor
      const student = await prisma.user.findFirst({
        where: {
          id: studentId,
          professorId: session.user.id,
        },
      });
      if (student) {
        targetUserId = studentId;
      }
    } else if (session.user.role === 'PROFESSOR') {
      // Se for professor sem studentId, retorna vazio
      return NextResponse.json([]);
    }

    const photos = await prisma.photo.findMany({
      where: { userId: targetUserId },
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

    // Verify permission: owner of the photo OR professor linked to the student
    const existingPhoto = await prisma.photo.findUnique({
      where: { id },
    });

    if (!existingPhoto) {
      return NextResponse.json(
        { error: 'Foto não encontrada' },
        { status: 404 }
      );
    }

    const isOwner = existingPhoto.userId === session.user.id;
    let isProfessor = false;

    if (!isOwner && session.user.role === 'PROFESSOR') {
      const student = await prisma.user.findFirst({
        where: {
          id: existingPhoto.userId,
          professorId: session.user.id,
        },
      });
      console.log('Verifying professor delete. Student found:', student);
      if (student) isProfessor = true;
    }

    if (!isOwner && !isProfessor) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    // Remove o arquivo físico
    const filePath = join(process.cwd(), 'public', existingPhoto.url);
    try {
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
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

    // Verify permission: owner of the photo OR professor linked to the student
    const existingPhoto = await prisma.photo.findUnique({
      where: { id },
    });

    if (!existingPhoto) {
      return NextResponse.json(
        { error: 'Foto não encontrada' },
        { status: 404 }
      );
    }

    const isOwner = existingPhoto.userId === session.user.id;
    let isProfessor = false;

    if (!isOwner && session.user.role === 'PROFESSOR') {
      const student = await prisma.user.findFirst({
        where: {
          id: existingPhoto.userId,
          professorId: session.user.id,
        },
      });
      console.log('Verifying professor update. Student found:', student);
      if (student) isProfessor = true;
    }

    if (!isOwner && !isProfessor) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    // Remove o arquivo físico antigo
    const oldFilePath = join(process.cwd(), 'public', existingPhoto.url);
    try {
      if (existsSync(oldFilePath)) {
        await unlink(oldFilePath);
      }
    } catch (error) {
      console.error('Erro ao remover arquivo antigo:', error);
    }

    // Gera um nome único para o novo arquivo
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');

    // Garantir que o diretório existe
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

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
        angle: angle as any,
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