import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { unlink } from 'fs/promises';
import { put, del } from '@vercel/blob';

// Esta versão usa Vercel Blob Storage para resolver o erro EROFS: read-only file system
// Nota: Nenhuma alteração no sistema de arquivos é feita neste código
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in POST photos:', session);

    if (!session?.user?.id) {
      console.error('Erro de autenticação: usuário não autenticado');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    console.log('Parseando formData...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const angle = formData.get('angle') as string;
    const date = formData.get('date') as string;

    console.log('Dados recebidos:', {
      fileReceived: !!file, 
      fileSize: file ? file.size : 'N/A', 
      fileType: file ? file.type : 'N/A',
      angle, 
      date
    });

    if (!file || !angle || !date) {
      console.error('Dados inválidos:', { file: !!file, angle, date });
      return NextResponse.json(
        { error: 'Arquivo, ângulo e data são obrigatórios' },
        { status: 400 }
      );
    }

    try {
      // Verificar se o token do Blob Storage está configurado
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error('ERRO: BLOB_READ_WRITE_TOKEN não configurado');
        return NextResponse.json(
          { error: 'Configuração de storage ausente', details: 'BLOB_READ_WRITE_TOKEN não configurado' },
          { status: 500 }
        );
      }
      
      // Upload para Vercel Blob Storage
      const fileName = `${uuidv4()}.${file.name.split('.').pop()}`;
      console.log(`Fazendo upload para Vercel Blob Storage: ${fileName}`);
      
      try {
        const blob = await put(fileName, file, {
          access: 'public',
        });
        
        console.log('Blob criado:', blob);

        // Salva a referência no banco de dados
        console.log('Criando registro no banco de dados...');
        const photo = await prisma.photo.create({
          data: {
            userId: session.user.id,
            url: blob.url, // Usa a URL do blob diretamente
            angle,
            date: new Date(date),
          },
        });

        console.log('Foto criada com sucesso:', photo);
        return NextResponse.json(photo);
      } catch (blobError) {
        console.error('Erro específico do Vercel Blob:', blobError);
        // Verificar problemas específicos com o serviço Blob
        return NextResponse.json(
          { 
            error: 'Erro no serviço de armazenamento', 
            message: blobError instanceof Error ? blobError.message : 'Erro ao usar Vercel Blob Storage',
            details: JSON.stringify(blobError)
          },
          { status: 500 }
        );
      }
    } catch (uploadError) {
      console.error('Erro ao fazer upload para Blob Storage:', uploadError);
      return NextResponse.json(
        { error: 'Erro ao fazer upload da imagem', details: uploadError instanceof Error ? uploadError.message : 'Erro desconhecido' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao criar foto:', error);
    let errorMessage = 'Erro desconhecido';
    let errorDetails = null;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error);
    }
    
    return NextResponse.json(
      { 
        error: 'Erro ao criar foto', 
        message: errorMessage,
        details: errorDetails
      },
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

    try {
      // Extrair o nome do arquivo da URL do blob
      const blobUrl = existingPhoto.url;
      const blobUrlParts = new URL(blobUrl);
      const pathname = blobUrlParts.pathname;
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
      
      console.log('Tentando excluir blob:', filename);
      
      // Deletar o blob
      if (filename) {
        await del(filename);
        console.log('Blob excluído com sucesso');
      }
    } catch (deleteError) {
      console.error('Erro ao excluir blob:', deleteError);
      // Continua mesmo se falhar ao excluir o blob
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
      console.error('Erro de autenticação no PUT: usuário não autenticado');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    console.log('Parseando formData em PUT...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const angle = formData.get('angle') as string;
    const date = formData.get('date') as string;
    const id = formData.get('id') as string;

    console.log('Dados recebidos em PUT:', {
      id,
      fileReceived: !!file, 
      fileSize: file ? file.size : 'N/A', 
      fileType: file ? file.type : 'N/A',
      angle, 
      date
    });

    if (!file || !angle || !date || !id) {
      console.error('Dados inválidos em PUT:', { file: !!file, angle, date, id });
      return NextResponse.json(
        { error: 'Arquivo, ângulo, data e id são obrigatórios' },
        { status: 400 }
      );
    }

    // Verifica se a foto pertence ao usuário
    console.log('Verificando se a foto pertence ao usuário...');
    const existingPhoto = await prisma.photo.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingPhoto) {
      console.error('Foto não encontrada:', id);
      return NextResponse.json(
        { error: 'Foto não encontrada' },
        { status: 404 }
      );
    }

    try {
      // Extrair o nome do arquivo da URL do blob antigo
      const oldBlobUrl = existingPhoto.url;
      
      // Verifica se é uma URL do Vercel Blob Storage
      if (oldBlobUrl.includes('vercel-storage.com')) {
        const oldBlobUrlParts = new URL(oldBlobUrl);
        const oldPathname = oldBlobUrlParts.pathname;
        const oldFilename = oldPathname.substring(oldPathname.lastIndexOf('/') + 1);
        
        console.log('Tentando excluir blob antigo:', oldFilename);
        
        // Deletar o blob antigo
        if (oldFilename) {
          await del(oldFilename);
          console.log('Blob antigo excluído com sucesso');
        }
      } else {
        console.log('URL antiga não é do Vercel Blob Storage, pulando exclusão');
      }
    } catch (deleteError) {
      console.error('Erro ao excluir blob antigo:', deleteError);
      // Continua mesmo se falhar ao excluir o blob antigo
    }

    try {
      // Upload do novo arquivo para Vercel Blob Storage
      const fileName = `${uuidv4()}.${file.name.split('.').pop()}`;
      console.log(`Fazendo upload do novo arquivo para Vercel Blob Storage: ${fileName}`);
      
      const blob = await put(fileName, file, {
        access: 'public',
      });
      
      console.log('Novo blob criado:', blob);

      // Atualiza a referência no banco de dados
      console.log('Atualizando registro no banco de dados...');
      const updatedPhoto = await prisma.photo.update({
        where: { id },
        data: {
          url: blob.url, // Usa a URL do blob diretamente
          angle,
          date: new Date(date),
        },
      });

      console.log('Foto atualizada com sucesso:', updatedPhoto);
      return NextResponse.json(updatedPhoto);
    } catch (uploadError) {
      console.error('Erro ao fazer upload do novo arquivo para Blob Storage:', uploadError);
      return NextResponse.json(
        { error: 'Erro ao fazer upload da nova imagem', details: uploadError instanceof Error ? uploadError.message : 'Erro desconhecido' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao atualizar foto:', error);
    let errorMessage = 'Erro desconhecido';
    let errorDetails = null;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error);
    }
    
    return NextResponse.json(
      { 
        error: 'Erro ao atualizar foto', 
        message: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
} 