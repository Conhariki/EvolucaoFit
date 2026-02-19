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
    const dateStr = searchParams.get('date');

    if (!id && !dateStr) {
      return NextResponse.json(
        { error: 'ID da foto ou data é obrigatório' },
        { status: 400 }
      );
    }

    // Determine target user (professor logic)
    let targetUserId = session.user.id;
    // For bulk delete by date, we might need studentId if professor is acting
    // But usually handleDeleteDate is called in context of a student if selected.
    // The current frontend implementation of handleDeleteDate doesn't pass studentId in query params,
    // only date. This might be an issue if a professor is viewing a student.
    // However, the GET request uses studentId.
    // Let's check how we can know the studentId here.
    // If it's bulk delete, we might delete photos from the wrong user if we just use session.user.id
    // But let's look at how GET does it. It reads studentId from searchParams.
    // The frontend sends axios.delete(\`/api/photos?date=\${encodeURIComponent(date)}\`);
    // It does NOT send studentId.
    // We should probably rely on finding the photos first to verify ownership.

    if (id) {
      // Single photo deletion logic (existing)
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
        if (student) isProfessor = true;
      }

      if (!isOwner && !isProfessor) {
        return NextResponse.json(
          { error: 'Não autorizado' },
          { status: 403 }
        );
      }

      const filePath = join(process.cwd(), 'public', existingPhoto.url);
      try {
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch (error) {
        console.error('Erro ao remover arquivo físico:', error);
      }

      await prisma.photo.delete({
        where: { id },
      });

      return NextResponse.json({ message: 'Foto excluída com sucesso' });

    } else if (dateStr) {
      // Bulk deletion by date
      // Format expected: dd/mm/yyyy
      const [day, month, year] = dateStr.split('/').map(Number);

      if (!day || !month || !year) {
        return NextResponse.json({ error: 'Data inválida' }, { status: 400 });
      }

      const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

      console.log('Deleting photos for date range:', startDate, endDate);

      // Find photos in this range
      // We need to be careful about WHOSE photos we are deleting.
      // If we don't have studentId, we can only delete photos of the logged in user OR
      // we need to find photos and verify permissions for each (or collectively).

      // Strict approach: Find photos that match the date AND (userId is session.user.id OR userId is a student of session.user.id)

      const photosToDelete = await prisma.photo.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const deletedIds = [];
      const errors = [];

      for (const photo of photosToDelete) {
        // Check permission for each photo
        const isOwner = photo.userId === session.user.id;
        let isProfessor = false;

        if (!isOwner && session.user.role === 'PROFESSOR') {
          const student = await prisma.user.findFirst({
            where: {
              id: photo.userId,
              professorId: session.user.id,
            },
          });
          if (student) isProfessor = true;
        }

        if (isOwner || isProfessor) {
          // Delete file
          const filePath = join(process.cwd(), 'public', photo.url);
          try {
            if (existsSync(filePath)) {
              await unlink(filePath);
            }
          } catch (error) {
            console.error(`Erro ao remover arquivo físico ${photo.id}:`, error);
          }

          // Delete db
          await prisma.photo.delete({ where: { id: photo.id } });
          deletedIds.push(photo.id);
        }
      }

      return NextResponse.json({ message: `Excluídas ${deletedIds.length} fotos` });
    }

    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });

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
    const file = formData.get('file') as File | null;
    const angle = formData.get('angle') as string | null;
    const date = formData.get('date') as string | null;
    const id = formData.get('id') as string;

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
      console.log('Verifying professor update. Student found:', student);
      if (student) isProfessor = true;
    }

    if (!isOwner && !isProfessor) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    const dataToUpdate: any = {};
    if (angle) dataToUpdate.angle = angle;
    if (date) dataToUpdate.date = new Date(date);

    // Only process file if it was provided
    if (file && file.size > 0) {
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

      dataToUpdate.url = `/uploads/${fileName}`;
    }

    // Atualiza a referência no banco de dados
    const updatedPhoto = await prisma.photo.update({
      where: { id },
      data: dataToUpdate,
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