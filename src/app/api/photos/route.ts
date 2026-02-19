import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';

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

    // Converte o arquivo para buffer e depois para base64 para envio
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileBase64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    console.log('Enviando para Cloudinary...');

    // Upload para o Cloudinary
    const result = await cloudinary.uploader.upload(fileBase64, {
      folder: 'evolucao-fit/photos',
      public_id: `${targetUserId}-${Date.now()}`,
      resource_type: 'image',
    });

    console.log('Upload concluído:', result.secure_url);

    // Salva a referência no banco de dados
    const photo = await prisma.photo.create({
      data: {
        userId: targetUserId,
        url: result.secure_url,
        angle: angle as any,
        date: new Date(date),
      },
    });

    console.log('Foto criada no banco:', photo);

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

    if (id) {
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

      // Tenta remover do Cloudinary
      if (existingPhoto.url.includes('cloudinary')) {
        try {
          const urlParts = existingPhoto.url.split('/');
          const filename = urlParts[urlParts.length - 1]; // "user-timestamp.jpg"
          const filenameWithoutExt = filename.split('.')[0]; // "user-timestamp"
          const publicId = `evolucao-fit/photos/${filenameWithoutExt}`;

          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error('Erro ao remover do Cloudinary:', error);
        }
      }

      await prisma.photo.delete({
        where: { id },
      });

      return NextResponse.json({ message: 'Foto excluída com sucesso' });

    } else if (dateStr) {
      // Bulk deletion by date
      const [day, month, year] = dateStr.split('/').map(Number);

      if (!day || !month || !year) {
        return NextResponse.json({ error: 'Data inválida' }, { status: 400 });
      }

      const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

      const photosToDelete = await prisma.photo.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const deletedIds = [];

      for (const photo of photosToDelete) {
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
          // Remove do Cloudinary
          if (photo.url.includes('cloudinary')) {
            try {
              const urlParts = photo.url.split('/');
              const filename = urlParts[urlParts.length - 1];
              const filenameWithoutExt = filename.split('.')[0];
              const publicId = `evolucao-fit/photos/${filenameWithoutExt}`;

              await cloudinary.uploader.destroy(publicId);
            } catch (error) {
              console.error('Erro ao remover do Cloudinary:', error);
            }
          }

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

    const dataToUpdate: any = {};
    if (angle) dataToUpdate.angle = angle;
    if (date) dataToUpdate.date = new Date(date);

    if (file && file.size > 0) {
      // Remove a foto antiga do Cloudinary
      if (existingPhoto.url.includes('cloudinary')) {
        try {
          const urlParts = existingPhoto.url.split('/');
          const filename = urlParts[urlParts.length - 1];
          const filenameWithoutExt = filename.split('.')[0];
          const publicId = `evolucao-fit/photos/${filenameWithoutExt}`;

          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error('Erro ao remover arquivo antigo do Cloudinary:', error);
        }
      }

      // Upload da nova foto
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileBase64 = `data:${file.type};base64,${buffer.toString('base64')}`;

      const result = await cloudinary.uploader.upload(fileBase64, {
        folder: 'evolucao-fit/photos',
        public_id: `${existingPhoto.userId}-${Date.now()}`,
        resource_type: 'image',
      });

      dataToUpdate.url = result.secure_url;
    }

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
