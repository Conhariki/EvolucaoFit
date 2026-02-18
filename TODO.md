# TODO - Sistema de Acompanhamento de Evolução de Aluno

## Tela 1 - Cadastro de Aluno
- [x] Adicionar campos ao cadastro: Data de nascimento
- [x] Adicionar campos ao cadastro: Altura
- [x] Adicionar campos ao cadastro: Telefone
- [x] Adicionar campos ao cadastro: Endereço completo
- [x] Atualizar schema do banco de dados com novos campos
- [x] Criar/atualizar tela de cadastro de aluno com todos os campos
- [x] Implementar seletor de aluno no cabeçalho/configurações para mudar entre alunos

## Tela 2 - Cadastro de Medidas
- [x] Criar modelo/tabela para tipos de medidas personalizadas
- [x] Criar tela de cadastro de tipos de medidas
- [x] Permitir cadastrar medidas como: Peitoral, Bíceps direito, Bíceps esquerdo, Antebraço esquerdo, Antebraço direito, Quadril, Cintura, Coxa direita, Coxa esquerda, Panturrilha esquerda, Panturrilha direita
- [x] Permitir adicionar/remover/editar tipos de medidas

## Tela 3 - Lançamento de Medidas
- [x] Atualizar tela de lançamento para usar medidas cadastradas dinamicamente
- [x] Garantir que a data seja selecionável
- [x] Garantir que todas as medidas cadastradas apareçam no formulário
- [x] Garantir vínculo com aluno selecionado

## Tela 4 - Lançamento de Foto por Data
- [x] Adicionar tipos de foto: Duplo bíceps frente (BICEPS_FRONT)
- [x] Adicionar tipos de foto: Duplo bíceps costa (BICEPS_BACK)
- [x] Atualizar enum PhotoAngle no schema
- [ ] Permitir alterar tipos de foto (editar/cadastrar novos tipos) - Os tipos estão fixos no enum, mas podem ser alterados no código
- [x] Garantir visualização lado a lado das datas para comparação (já existe parcialmente)
- [x] Criar comparação mensal: mês a mês por ângulo (Jan-2024 Frente | Fev-2024 Frente | Mar-2024 Frente)
- [x] Criar visualização por mês: todas as fotos de um mês (Frente, Costa, Lado esquerdo, Lado direito, Duplo bíceps)

## Tela 5 - Cadastro de Profissional
- [x] Criar tela de cadastro de profissional com todos os campos do aluno (nome, data nascimento, altura, telefone, email, endereço)
- [x] Atualizar schema se necessário

## Tela 6 - Vínculo Profissional x Aluno
- [x] Criar tela de vínculo profissional x aluno
- [x] Permitir que profissional vincule alunos
- [x] Implementar filtro: sistema só mostra alunos do profissional quando login é feito pelo profissional
- [x] Implementar filtro: quando login é feito pelo aluno, exibir apenas ele mesmo

## Funcionalidades Gerais
- [x] Atualizar todas as queries para respeitar o filtro de profissional/aluno
- [x] Atualizar API de medidas para usar aluno selecionado
- [x] Atualizar API de fotos para usar aluno selecionado
- [ ] Atualizar dashboard para usar aluno selecionado (parcial - precisa verificar se está funcionando)
