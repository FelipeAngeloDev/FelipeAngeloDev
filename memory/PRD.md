# CodeMaster — Aprenda Programação

## Visão Geral
App mobile de educação em programação, em Português (pt-BR), construído com Expo Router (React Native), FastAPI e MongoDB.

## Funcionalidades principais
- Login com Google via Emergent Auth (sessões persistidas com cookie + Bearer token).
- 4 trilhas: Python, JavaScript, HTML/CSS e Java — com lições teóricas (markdown + syntax highlight) e exercícios de múltipla escolha.
- Sistema de progresso: XP (+20 por lição), streak diário e percentuais por trilha.
- Tutor IA com seletor de modelo (Claude Sonnet 4.5 / GPT-5.2) via `emergentintegrations` + `EMERGENT_LLM_KEY`.
- Navegação por tabs: Cursos, Tutor IA, Progresso, Perfil.

## Stack
- Backend: FastAPI + MongoDB (motor) + emergentintegrations
- Frontend: Expo Router (React Native) + AsyncStorage + lucide-react-native

## Estrutura
- `/app/backend/server.py` — API REST (auth, courses, progress, tutor)
- `/app/backend/courses_data.py` — conteúdo seed das trilhas e lições
- `/app/frontend/app/*` — telas (login, tabs, course/[slug], lesson/[slug]/[id])
- `/app/frontend/src/contexts/AuthContext.tsx` — auth state + deep link handler
- `/app/frontend/src/Markdown.tsx` — renderer markdown com highlight de código

## Endpoints
- POST /api/auth/session, GET /api/auth/me, POST /api/auth/logout
- GET /api/courses, GET /api/courses/{slug}, GET /api/courses/{slug}/lessons/{lesson_id}
- GET /api/progress, POST /api/progress/complete
- POST /api/tutor/chat, GET /api/tutor/history

## Próximas iterações sugeridas
- Editor de código interativo com execução
- Mais lições por trilha + projetos finais
- Sistema de conquistas e ranking semanal (motiva retenção e referral)
- Premium/assinatura para trilhas avançadas (monetização)
