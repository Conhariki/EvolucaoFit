#!/bin/bash

# Limpar caches
rm -rf .next

# Instalar dependências
npm install

# Fazer build com TypeScript ignorando erros
export NEXT_SKIP_TYPE_CHECK=true
npm run build 