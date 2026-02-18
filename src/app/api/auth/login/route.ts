import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sign } from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Validação básica
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Busca o usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Email ou senha inválidos' },
        { status: 401 }
      );
    }

    // Verifica a senha
    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Email ou senha inválidos' },
        { status: 401 }
      );
    }

    // Gera o token JWT
    const token = sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    // Remove a senha do objeto retornado
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Login realizado com sucesso',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return NextResponse.json(
      { message: 'Erro ao fazer login' },
      { status: 500 }
    );
  }
} 