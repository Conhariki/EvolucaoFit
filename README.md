# EvoluçãoFit

Aplicativo multiplataforma para acompanhamento da evolução física de alunos de academia.

## 🚀 Tecnologias

- React Native (Mobile)
- React (Web)
- Node.js (Backend)
- MongoDB (Database)
- Firebase (Authentication & Storage)
- TypeScript

## 📱 Plataformas Suportadas

- Android
- iOS
- Web (Responsivo)

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/evolucaofit.git
cd evolucaofit
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Inicie o projeto:
```bash
npm run dev
```

## 🔑 Funcionalidades

### Professor
- Cadastro de alunos
- Acompanhamento da evolução dos alunos
- Notificações de atualizações
- Dashboard com métricas

### Aluno
- Registro de medidas corporais
- Upload de fotos em diferentes ângulos
- Comparação de evolução
- Histórico completo
- Gráficos de progresso

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Configuração do Vercel Blob Storage

Para que o upload de fotos funcione no ambiente Vercel, é necessário configurar o Vercel Blob Storage:

1. No painel do Vercel, vá para Settings > Tokens e crie um novo token
2. Adicione a seguinte variável de ambiente no projeto Vercel:
   - `BLOB_READ_WRITE_TOKEN=vercel_blob_rw_{seu_token_aqui}`

3. Localmente, crie um arquivo `.env.local` com o mesmo token para testar

## Migração de arquivos existentes

Se você já tem fotos salvas em `/public/uploads/`, precisará migrá-las para o Vercel Blob Storage. Você pode fazer isso manualmente usando o painel do Vercel ou criar um script para automatizar esse processo.

## Como funciona

- O upload de fotos agora usa o Vercel Blob Storage ao invés de salvar no sistema de arquivos
- As URLs das fotos agora apontam diretamente para o servidor de blob do Vercel
- Isso resolve o problema de upload em produção, pois o ambiente Vercel não permite escrita no sistema de arquivos 