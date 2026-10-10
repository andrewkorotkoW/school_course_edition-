# EduQuest

Образовательная платформа для школьников 1–11 класс, разделённая по игровым механикам под возраст. Полная концепция — в [docs/CONCEPT.md](docs/CONCEPT.md).

## Зафиксированные решения по MVP

- **Возраст**: 1–4 класс.
- **Механика**: остров/питомец растёт от выполненных заданий. Без рейтингов, таймеров и публичного проигрыша.
- **Предметы**: математика + русский язык.
- **Стек**: backend — Python/FastAPI + SQLAlchemy + PostgreSQL; frontend — Next.js (React) + Phaser.js для игрового слоя острова; dev-окружение — Docker Compose.

## Структура репозитория

```
backend/            FastAPI-приложение
  app/
    core/            конфигурация
    db/               подключение к БД, сид тестовых данных
    models/          SQLAlchemy-модели (Student, Subject, Quest, Progress, Island)
    schemas/         Pydantic-схемы
    api/routes/      эндпоинты
frontend/            Next.js-приложение
  app/                страницы (/, /island)
  components/         IslandCanvas.tsx — заготовка Phaser-сцены острова
docs/
  CONCEPT.md           полная концепция (возрастные зоны, игровые механики, открытые вопросы)
docker-compose.yml
.env.example
```

## Быстрый старт

```bash
cp .env.example .env
docker compose up --build
```

- Backend: http://localhost:8000 (`/health`, `/subjects`, `/students/{id}/island`)
- Frontend: http://localhost:3000

Засеять тестовые предметы и первый квест:

```bash
docker compose exec backend python -m app.db.seed
```

> На хосте установлен Node v12 — для фронтенда он слишком старый (Next.js требует 18+). Поэтому frontend собирается и запускается только внутри Docker (образ `node:20-alpine`) — локально `npm install`/`npm run dev` без контейнера работать не будет, пока вы не обновите Node на машине.

## Что ещё не реализовано (сознательно, для MVP-среза)

- Нет миграций (Alembic) — таблицы создаются напрямую при старте backend.
- Нет авторизации/реальных ученических аккаунтов — `/island` использует захардкоженный `student_id=1`.
- Нет контента квестов (задач по математике/русскому) — есть только модель данных и один сид-квест на предмет.
- Нет родительского/учительского интерфейса — см. открытые вопросы в [docs/CONCEPT.md](docs/CONCEPT.md).
