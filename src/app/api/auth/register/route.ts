import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { name, email, password, role, birthDate, height, phone, address } = await req.json();

    // Verify session - only admin can register new users
    // Import getServerSession and authOptions dynamically or from lib
    const { getServerSession } = await import('next-auth/next');
    const { authOptions } = await import('@/lib/auth');

    const session = await getServerSession(authOptions);

    if (session?.user?.email !== 'felipe.conhariki@gmail.com') {
      return NextResponse.json(
        { message: 'Apenas administradores podem registrar novos usuários.' },
        { status: 403 }
      );
    }

    // Validação básica
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: 'Nome, email, senha e tipo de conta são obrigatórios' },
        { status: 400 }
      );
    }

    // Verifica se o email já está em uso
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Este email já está em uso' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await hash(password, 12);

    // Cria o usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        birthDate: birthDate ? new Date(birthDate) : null,
        height: height ? parseFloat(height) : null,
        phone: phone || null,
        address: address || null,
      },
    });

    // Remove a senha do objeto retornado
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: 'Usuário criado com sucesso', user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { message: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
} 