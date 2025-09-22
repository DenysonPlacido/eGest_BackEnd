// /workspaces/eGest_BackEnd/docs/swaggerTags/pessoas.js

// 📌 POST /api/pessoas – Cadastro de pessoa
/**
 * @openapi
 * /api/pessoas:
 *   post:
 *     summary: Cadastra uma nova pessoa
 *     tags:
 *       - Pessoas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo_pessoa
 *               - cpf_cnpj
 *               - nome
 *             properties:
 *               tipo_pessoa:
 *                 type: string
 *               cpf_cnpj:
 *                 type: string
 *               nome:
 *                 type: string
 *               data_nascimento:
 *                 type: string
 *                 format: date
 *               ddd:
 *                 type: string
 *               fone:
 *                 type: string
 *               email:
 *                 type: string
 *               cep:
 *                 type: string
 *               cod_logradouro:
 *                 type: integer
 *               numero:
 *                 type: string
 *               cod_bairro:
 *                 type: integer
 *               complemento:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pessoa cadastrada com sucesso
 *       400:
 *         description: Campos obrigatórios não preenchidos
 *       409:
 *         description: CPF/CNPJ já cadastrado
 *       500:
 *         description: Erro interno
 */



// 🔍 GET /api/pessoas – Buscar pessoas

/**
 * @openapi
 * /api/pessoas:
 *   get:
 *     summary: Lista pessoas com filtros opcionais
 *     tags:
 *       - Pessoas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nome
 *         schema:
 *           type: string
 *         description: Nome da pessoa
 *       - in: query
 *         name: pessoa_id
 *         schema:
 *           type: integer
 *         description: ID da pessoa
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Lista de pessoas
 *       500:
 *         description: Erro interno
 */



// ✏️ PUT /api/pessoas/{id} – Atualizar pessoa

/**
 * @openapi
 * /api/pessoas/{id}:
 *   put:
 *     summary: Atualiza os dados de uma pessoa
 *     tags:
 *       - Pessoas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da pessoa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo_pessoa:
 *                 type: string
 *               cpf_cnpj:
 *                 type: string
 *               nome:
 *                 type: string
 *               data_nascimento:
 *                 type: string
 *                 format: date
 *               ddd:
 *                 type: string
 *               fone:
 *                 type: string
 *               email:
 *                 type: string
 *               cep:
 *                 type: string
 *               cod_logradouro:
 *                 type: integer
 *               numero:
 *                 type: string
 *               cod_bairro:
 *                 type: integer
 *               complemento:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pessoa atualizada com sucesso
 *       500:
 *         description: Erro interno
 */



// 🗑️ DELETE /api/pessoas/{id} – Excluir pessoa

/**
 * @openapi
 * /api/pessoas/{id}:
 *   delete:
 *     summary: Exclui uma pessoa pelo ID
 *     tags:
 *       - Pessoas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da pessoa
 *     responses:
 *       200:
 *         description: Pessoa deletada com sucesso
 *       500:
 *         description: Erro interno
 */



// 📍 GET /api/pessoas/enderecos/buscar – Buscar endereço por CEP

/**
 * @openapi
 * /api/pessoas/enderecos/buscar:
 *   get:
 *     summary: Busca endereço pelo CEP
 *     tags:
 *       - Pessoas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cep
 *         required: true
 *         schema:
 *           type: string
 *         description: CEP para busca
 *     responses:
 *       200:
 *         description: Endereço encontrado
 *       400:
 *         description: CEP não informado
 *       404:
 *         description: Endereço não encontrado
 *       500:
 *         description: Erro interno
 */

 

