# Módulo de comissionamento

## 1. Objetivo

O objetivo deste módulo é criar a parte de comissionamento, onde o usuários poderá fazer um CRUD de suas comissões. 

## 2. Regras de Negócio

Campos da tabela de comissões e do módulo de comissionamento:

DATA_OS: date, not null
DATA: date, not null
NUMERO DA OS: varchar, not null
CLIENTE: varchar, not null
TOTAL: decimal, not null
TAXAS: decimal
PEÇAS: decimal
DEPESAS: decimal
LUCRO: decimal, not null
PORCENTAGEM DE COMISSAO: decimal, not null
TOTAL COMISSAO decimal, not null
OBSERVAÇÕES: varchar

- O lucro é calculado automaticamente subtraindo as taxas, peças e despesas do total.
- A porcetagem da comissão é um valor que é fixo mas pode ser alterado pelo administrador nas opções do sistema. Ao ser alterado, o valor da comissão só será alterado para as comissões futuras, não alterando as comissões já existentes.
- O total de comissão é calculado automaticamente multiplicando o lucro pela porcentagem de comissão.
- O comissonamento é feito para cada mês, mas pode ser feito o cadastramento de comissões de meses anteriores e futuros.
- Precisa ter a opção de repetir a comissão para os próximos meses(ter a opção de digitar quantos meses deseja repetir) ou se é fixo.
- Para calcular as taxas precisa ter um campo para selecionar se tem ou não taxas, se tiver vai poder escolher entre cartão, link de pagamento. nas opções do sistema coloca a opção para cadastrar essas taxas. 


- Não esquece de adionar essas opções no controle de usuários já implementado no sistema.

- Ter a opção de exportar a tabela em PDF e Excel do mês, a formatação deve ser no tipo tabela precisa sair no modo paisagem pronta para impressão.

# Testes

- Implementar nos testes atuais para verificar se está funcionando corretamente todas as regras de negócio acima.
- Não esquece de adicionar os testes para o novo módulo de comissionamento.

