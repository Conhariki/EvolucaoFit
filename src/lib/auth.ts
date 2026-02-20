import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            allowDangerousEmailAccountLinking: true,
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Senha', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email e senha são obrigatórios');
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user) {
                    throw new Error('Usuário não encontrado');
                }

                if (!user.password) {
                    throw new Error('Por favor, faça login com o Google');
                }

                const isPasswordValid = await compare(credentials.password, user.password);

                if (!isPasswordValid) {
                    throw new Error('Senha incorreta');
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    height: user.height,
                    gender: user.gender,
                    theme: user.theme,
                };
            }
        })
    ],
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Se foi feita uma atualização manual pelo lado do cliente (useSession.update)
            if (trigger === 'update' && session) {
                if (session.theme) token.theme = session.theme;
                if (session.role) token.role = session.role;
                if (session.height) token.height = session.height;
                if (session.gender) token.gender = session.gender;
            }

            // Apenas no primeiro login (user é preenchido com dados do DB/Provider)
            if (user) {
                // É recomendado buscar no banco aqui para garantir dados atualizados (ex: num login Google)
                try {
                    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
                    if (dbUser) {
                        token.role = dbUser.role;
                        token.id = dbUser.id;
                        token.height = dbUser.height;
                        token.gender = dbUser.gender;
                        token.theme = dbUser.theme || 'dark';
                    } else {
                        token.role = user.role;
                        token.id = user.id;
                        token.height = user.height;
                        token.gender = user.gender;
                        token.theme = user.theme || 'dark';
                    }
                } catch (e) {
                    // Fallback seguro caso banco falhar
                    token.role = user.role;
                    token.id = user.id;
                    token.theme = user.theme || 'dark';
                }
            }
            return token;
        },
        async session({ session, token }: { session: any; token: any }) {
            if (token && session.user) {
                session.user.role = token.role;
                session.user.id = token.id;
                session.user.height = token.height;
                session.user.gender = token.gender;
                session.user.theme = token.theme || 'dark';
            }
            return session;
        }
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 dias
    },
    secret: process.env.NEXTAUTH_SECRET,
};
