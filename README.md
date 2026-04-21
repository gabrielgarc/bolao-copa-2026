# 🏆 Bolão Copa do Mundo 2026

Bem-vindo ao **Bolão Copa 2026**! Uma plataforma completa para gerenciar seus palpites, acompanhar resultados em tempo real e competir com amigos durante o maior evento de futebol do mundo.

---

## 🚀 Tecnologias Utilizadas

Este projeto utiliza uma arquitetura moderna e robusta:

- **Frontend:** [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/) + [Tailwind CSS](https://tailwindcss.com/)
- **Backend:** [.NET 8 API](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)
- **Banco de Dados:** [MongoDB](https://www.mongodb.com/)
- **IA:** [Google Gemini API](https://ai.google.dev/) (para insights e previsões)
- **Dados:** [Football-Data.org API](https://www.football-data.org/) (Sincronização de jogos e resultados)

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

*   [Node.js](https://nodejs.org/) (v18 ou superior)
*   [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)
*   [MongoDB](https://www.mongodb.com/try/download/community) (Rodando localmente na porta 27017 ou via Docker)
*   [Git](https://git-scm.com/)

---

## 🛠️ Configuração e Instalação

### 1. Clonar o Repositório
```bash
git clone https://github.com/gabrielgarc/bolao-copa-2026.git
cd bolao-copa-2026
```

### 2. Configurar o Frontend
Instale as dependências e configure as variáveis de ambiente:
```bash
npm install
```
Crie um arquivo `.env` na raiz do projeto (se não existir) e adicione sua chave do Gemini:
```env
GEMINI_API_KEY=sua_chave_aqui
```

### 3. Configurar o Backend
As configurações de banco de dados e API de terceiros estão localizadas em:
`backend/Bolao.Copa2026.API/appsettings.json`

> [!NOTE]
> O projeto já vem configurado para conectar ao MongoDB local em `mongodb://localhost:27017`.

---

## 🏃 Como Rodar a Aplicação

### O Jeito Fácil (Windows) ⚡

Se você estiver no Windows, pode iniciar tudo com um único comando usando o script PowerShell incluído:

```powershell
./run-all.ps1
```
Este script irá:
1. Iniciar o Backend (.NET)
2. Iniciar o Frontend (Vite)
3. Abrir o navegador em `http://localhost:3000`
4. Abrir o Swagger do Backend em `http://localhost:5000/swagger`

---

### O Jeito Manual

#### Backend
```bash
cd backend/Bolao.Copa2026.API
dotnet run
```

#### Frontend
```bash
# Na raiz do projeto
npm run dev
```

---

## 🌟 Funcionalidades Principais

- **Planilha Interativa:** Interface fluida para preencher palpites de todos os grupos e fases eliminatórias.
- **Cálculo de Pontos Automático:** Sistema que calcula pontos com base em placar exato, vencedor e saldo de gols.
- **Classificação em Tempo Real:** Tabelas de grupos que se atualizam instantaneamente conforme você simula os resultados.
- **Integração com IA:** Sugestões e análises baseadas no modelo Gemini da Google.
- **Sincronização de Dados:** Update automático de resultados reais via API externa.

---

## 📂 Estrutura do Projeto

```text
├── backend/                   # Código fonte da API .NET 8
│   ├── Bolao.Copa2026.API/    # Projeto principal da API
│   └── FootballData.Integration/ # Módulo de integração com APIs externas
├── components/                # Componentes React (UI)
├── services/                  # Serviços de integração frontend
├── App.tsx                    # Componente principal do Frontend
├── run-all.ps1                # Script de execução rápida
└── ...
```

---

## 🤝 Contribuição

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Adicionando nova feature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

---

<div align="center">
  Feito com ❤️ para os amantes do futebol. ⚽
</div>
