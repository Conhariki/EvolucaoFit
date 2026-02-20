import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    height?: number | null;
    gender?: string | null;
    theme?: string | null;
  }

  interface Session {
    user: User & {
      id: string;
      role: string;
      height?: number | null;
      gender?: string | null;
      theme?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    height?: number | null;
    gender?: string | null;
    theme?: string | null;
  }
} 