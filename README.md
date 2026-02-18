# EvoluçãoFit - Painel do Professor

Painel administrativo para acompanhamento da evolução física de alunos.

## 🚀 Tecnologias

- **Frontend:** Next.js 14, React, Chakra UI
- **Backend:** Next.js API Routes
- **Database:** SQLite (Prisma ORM)
- **Auth:** NextAuth.js
- **Uploads:** Local (uploads folder)

## 🛠️ Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/Conhariki/EvolucaoFit.git
cd EvolucaoFit
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Prepare o Banco de Dados:**
```bash
npx prisma generate
npx prisma db push
```

5. **Inicie o projeto:**
```bash
npm run dev
```

Acesse `http://localhost:3000` no seu navegador.

## 🔑 Funcionalidades Principais

- **Gestão de Alunos:** Cadastro e vínculo de alunos a professores.
- **Registro de Fotos:** Upload de fotos de evolução (Frente, Costas, Lado, etc).
- **Registro de Medidas:** Histórico completo de medidas corporais.
- **Comparação:** Ferramenta para comparar fotos lado a lado.
- **Gráficos:** Visualização da evolução de peso e medidas ao longo do tempo.

## 📝 Licença

Este projeto está sob a licença MIT. 