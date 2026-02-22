### 🟣 Life Hub

> **Painel pessoal para gerenciar finanças, entretenimento, jogos e viagens — tudo em um só lugar.**

🔗 **Repositório:** [github.com/leonardordasilva/life-hub](https://github.com/leonardordasilva/life-hub)

#### 📖 Descrição

O **Life Hub** (Leo's Live Hub) é uma plataforma web completa e modular de gestão de vida pessoal. Ele funciona como um dashboard centralizado onde o usuário pode gerenciar suas finanças, acompanhar filmes, séries, animes e livros, catalogar jogos e planejar viagens com voos, hotéis e passeios. A aplicação possui autenticação completa, onboarding personalizado, perfil com avatar, comunidade de usuários e persistência total de dados em nuvem via **Supabase**.

#### ✨ Funcionalidades Principais

- **🏠 Dashboard Home** com visão consolidada dos módulos ativados
- **💰 Módulo Financeiro:** categorias de receita/despesa, transações mensais, reserva anual
- **🎬 Módulo Entretenimento:** catálogo de filmes, séries, animes e livros com status (Pendente, Assistindo, Completo, Casual), avaliação, poster, sinopse, gêneros, controle granular de temporadas/episódios, data de conclusão
- **🎮 Módulo Jogos:** dashboard dedicado para catálogo de games
- **✈️ Módulo Férias/Viagens:** viagens com destino, datas e capa; voos (ida, ida-volta com PNR/localizador, preço, companhia aérea); hotéis (check-in/out, preço); passeios (full-day/half-day, empresa, horário)
- **👤 Autenticação completa:** cadastro, login, recuperação de senha, reset de senha via link
- **🧭 Onboarding personalizado:** na primeira vez, o usuário escolhe nome, avatar, data de nascimento e quais módulos deseja ativar
- **👥 Comunidade:** visualização de perfis de outros usuários, com acesso ao acervo de mídia e viagens compartilhados
- **📱 Interface responsiva** com sidebar colapsável para mobile
- **🌙 Dark theme** nativo (slate-950)
#### 🛠️ Stack Técnica

| Tecnologia | Uso |
|---|---|
| **React 18** | Framework de UI |
| **TypeScript** | Tipagem estática |
| **Supabase** (`@supabase/supabase-js`) | Backend-as-a-Service (autenticação, banco PostgreSQL, storage) |
| **Google Gemini AI** (`@google/genai`) | Funcionalidades de IA integradas |
| **Tailwind CSS 4** (`@tailwindcss/vite`) | Estilização com plugin Vite nativo |
| **Lucide React** | Ícones |
| **Vite 5** | Build tool e dev server |

#### 🏗️ Arquitetura do Código

    life-hub/
    ├── index.html
    ├── index.tsx
    ├── index.css
    ├── App.tsx
    ├── types.ts
    ├── views/
    │   ├── Home.tsx
    │   ├── LandingPage.tsx
    │   ├── LoginScreen.tsx
    │   ├── ForgotPassword.tsx
    │   ├── ResetPassword.tsx
    │   ├── SetupScreen.tsx
    │   ├── Profile/
    │   │   └── ProfilePage.tsx
    │   ├── Onboarding/
    │   │   └── OnboardingFlow.tsx
    │   ├── Finance/
    │   │   └── FinanceDashboard.tsx
    │   ├── Entertainment/
    │   │   └── EntertainmentDashboard.tsx
    │   ├── Games/
    │   │   └── GamesDashboard.tsx
    │   ├── Vacation/
    │   │   └── VacationDashboard.tsx
    │   └── Community/
    │       ├── CommunityPage.tsx
    │       └── CommunityUserView.tsx
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useProfile.ts
    │   └── useCommunity.ts
    ├── services/
    │   └── supabaseClient.ts
    ├── components/
    │   └── Toast.tsx
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
#### 🧠 Destaques Técnicos

- **Modelagem de dados rica**: tipagem completa em TypeScript com interfaces detalhadas para transações financeiras, itens de entretenimento (com tracking granular de episódios/temporadas, ISBN para livros, IDs externos para sincronização com TMDB/OpenLibrary), voos, hotéis e passeios.
- **Autenticação robusta com Supabase Auth**: fluxo completo de login, cadastro, forgot/reset password, sessão persistente com auto-refresh token, e proteção de rotas.
- **Onboarding modular**: o usuário personaliza sua experiência escolhendo quais módulos ativar (Finanças, Férias, Entretenimento, Jogos) e quais subtipos de entretenimento acompanhar (séries, filmes, animes, livros), além de configurar privacidade da comunidade por categoria.
- **Sistema de comunidade**: usuários podem compartilhar seletivamente seu catálogo de mídia e viagens, com visualização pública de perfis.
- **Arquitetura de hooks customizados**: separação clara entre lógica de autenticação (`useAuth`), dados de perfil (`useProfile`) e dados da comunidade (`useCommunity`), mantendo os componentes limpos.

---

## 🧰 Tecnologias em Comum

Ambos os projetos compartilham uma base tecnológica consistente:

- **React 18** + **TypeScript** como fundação
- **Vite 5** como bundler de alta performance
- **Tailwind CSS** para estilização utilitária
- **Google Gemini AI** para funcionalidades inteligentes
- **Lucide React** para iconografia consistente
- ESModules nativos e configuração moderna de TypeScript
