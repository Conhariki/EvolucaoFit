# Integração com Vercel Blob Storage

Este documento explica como foi implementada a integração com o Vercel Blob Storage para resolver o problema de upload de fotos no ambiente Vercel.

## Problema

No Vercel, o sistema de arquivos é somente leitura e efêmero, o que significa que qualquer arquivo salvo:
1. Não persiste entre diferentes execuções de funções serverless
2. Não pode ser escrito em produção
3. Pode ser excluído a qualquer momento

Isso causa falhas no upload de fotos quando a aplicação é hospedada no Vercel.

## Solução

A solução é usar o [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob), um serviço de armazenamento de objetos otimizado para aplicações Vercel.

### Alterações implementadas

1. Instalamos o pacote `@vercel/blob`:
   ```bash
   npm install @vercel/blob
   ```

2. Modificamos os endpoints da API em `src/app/api/photos/route.ts`:
   - Substituímos a escrita no sistema de arquivos pelo upload para o Vercel Blob Storage
   - Atualizamos as URLs no banco de dados para apontar diretamente para o servidor do Vercel Blob

3. Criamos um script de migração em `scripts/migrate-photos.js` para migrar as fotos existentes do sistema de arquivos local para o Blob Storage

### Configuração necessária

Para usar o Vercel Blob Storage, você precisa:

1. No painel de controle do Vercel:
   - Vá para Settings > Tokens
   - Crie um novo token com permissões para Blob Storage
   - Adicione a variável de ambiente:
     ```
     BLOB_READ_WRITE_TOKEN=vercel_blob_rw_{seu_token_aqui}
     ```

2. Localmente, para desenvolvimento:
   - Crie um arquivo `.env.local` na raiz do projeto
   - Adicione a mesma variável de ambiente:
     ```
     BLOB_READ_WRITE_TOKEN=vercel_blob_rw_{seu_token_aqui}
     ```
   - Reinicie o servidor de desenvolvimento

### Migração de fotos existentes

Para migrar as fotos já existentes no banco de dados e no sistema de arquivos:

1. Certifique-se de ter configurado o `.env.local` com o token correto
2. Execute o script de migração:
   ```bash
   node scripts/migrate-photos.js
   ```

### Vantagens

- As fotos são armazenadas em um CDN global, melhorando o desempenho
- Não há mais problemas de escrita no sistema de arquivos do Vercel
- As URLs são consistentes em todos os ambientes (desenvolvimento e produção)
- Você não precisa mais se preocupar com a criação e manutenção do diretório `public/uploads/`

### Limitações e considerações

- O Vercel Blob Storage é um serviço pago após certos limites de uso (verificar planos atuais)
- É necessário um token de acesso válido para funcionar
- Você deve migrar as fotos existentes manualmente ou usando o script fornecido 