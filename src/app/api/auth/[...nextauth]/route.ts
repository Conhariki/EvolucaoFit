import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Criar handler com a configuração
const handler = NextAuth(authOptions);

// Exportar apenas os handlers para GET e POST
export { handler as GET, handler as POST }; 