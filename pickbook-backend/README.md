# PickBook MVP

Платформа для публікації творчих текстів з інтеграцією музики.
Музика автоматично вмикається під час читання, коли читач доходить до потрібного місця.

---

## Структура проєкту

```
pickbook/
├── pickbook-backend/      # Java 17 + Spring Boot 3
└── pickbook-frontend/     # React 18 + TypeScript + Vite
```

---

## Передумови

Встановіть перед початком:

- **Java 17** — https://adoptium.net
- **Maven 3.9+** — https://maven.apache.org (або використовуйте `./mvnw` у папці бекенду)
- **Node.js 18+** — https://nodejs.org
- **PostgreSQL 15+** — https://www.postgresql.org

---

## Запуск бекенду

### 1. Створіть базу даних PostgreSQL

```sql
CREATE DATABASE pickbook_db;
```

### 2. Налаштуйте application.yml

Відкрийте `pickbook-backend/src/main/resources/application.yml` і вкажіть свої дані:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/pickbook_db
    username: postgres        # ← ваш PostgreSQL юзер
    password: your_password   # ← ваш пароль
```

> Таблиці створяться автоматично при першому запуску (`ddl-auto: update`)

### 3. Запустіть

```bash
cd pickbook-backend
./mvnw spring-boot:run
```

Або відкрийте проєкт у IntelliJ IDEA і натисніть Run на `PickBookApplication.java`

Бекенд запуститься на **http://localhost:8080**

---

## Запуск фронтенду

```bash
cd pickbook-frontend
npm install
npm run dev
```

Фронтенд запуститься на **http://localhost:5173**

> Завдяки proxy в `vite.config.ts` всі запити `/api/*` автоматично йдуть на `localhost:8080`

---

## API Ендпоінти

### Авторизація
| Метод | URL | Опис |
|-------|-----|------|
| POST | `/api/auth/register` | Реєстрація |
| POST | `/api/auth/login` | Вхід, повертає JWT |

### Твори
| Метод | URL | Опис | Auth? |
|-------|-----|------|-------|
| GET | `/api/works` | Всі твори (пагінація) | Ні |
| GET | `/api/works/search?query=...` | Пошук | Ні |
| GET | `/api/works/{id}` | Один твір | Ні |
| GET | `/api/works/author/{id}` | Твори автора | Ні |
| POST | `/api/works` | Створити твір | ✅ |
| PUT | `/api/works/{id}` | Оновити твір | ✅ |
| DELETE | `/api/works/{id}` | Видалити твір | ✅ |
| POST | `/api/works/{id}/comments` | Додати коментар | ✅ |
| POST | `/api/works/{id}/ratings` | Оцінити твір | ✅ |

### Приклад: створити твір з музикою (POST /api/works)

```json
{
  "title": "Осінній ліс",
  "content": "Листя падало повільно...",
  "description": "Коротке оповідання про осінь",
  "genre": "STORY",
  "musicMarkers": [
    {
      "charPosition": 150,
      "musicUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "trackTitle": "Осіння мелодія"
    }
  ]
}
```

---

## Як працює музика

1. **Автор** пише текст в редакторі, ставить курсор у потрібне місце і натискає **"♪ Додати музику тут"**
2. Вставляє посилання на YouTube трек і необов'язкову назву
3. Зберігає — бекенд зберігає `{ charPosition: 1500, musicUrl: "..." }` у таблиці `music_markers`

4. **Читач** відкриває твір — фронтенд ініціалізує прихований YouTube IFrame плеєр
5. При скролі JavaScript відстежує приблизну позицію в тексті
6. Коли читач доходить до збереженої позиції — музика вмикається автоматично
7. Знизу екрану з'являється банер з назвою треку і кнопкою зупинки

---

## Технологічний стек

### Бекенд
| Технологія | Навіщо |
|-----------|--------|
| Spring Boot 3 | Основний фреймворк |
| Spring Security | Авторизація |
| JWT (jjwt) | Токени доступу |
| Spring Data JPA | Робота з базою даних |
| PostgreSQL | База даних |
| Lombok | Скорочення коду |
| Bean Validation | Валідація запитів |

### Фронтенд
| Технологія | Навіщо |
|-----------|--------|
| React 18 | UI фреймворк |
| TypeScript | Типізація |
| Vite | Збірка проєкту |
| React Router | Маршрутизація |
| Axios | HTTP запити |
| YouTube IFrame API | Відтворення музики |

---

## Структура бекенду

```
src/main/java/com/pickbook/
├── PickBookApplication.java      # Точка входу
├── config/
│   ├── SecurityConfig.java       # Spring Security + CORS
│   └── GlobalExceptionHandler.java
├── entity/
│   ├── User.java                 # Користувач (AUTHOR / READER)
│   ├── Work.java                 # Твір
│   ├── MusicMarker.java          # Музична мітка
│   ├── Comment.java
│   └── Rating.java
├── repository/                   # Інтерфейси для роботи з БД
├── service/
│   └── WorkService.java          # Вся бізнес-логіка
├── controller/
│   ├── AuthController.java       # /api/auth/*
│   └── WorkController.java       # /api/works/*
├── dto/
│   └── Dtos.java                 # Request/Response об'єкти
└── security/
    ├── JwtUtil.java              # Генерація та перевірка JWT
    ├── JwtFilter.java            # Фільтр кожного запиту
    └── UserDetailsServiceImpl.java
```

---

## Наступні кроки після MVP

- [ ] Підписки на авторів
- [ ] Добірки / колекції творів
- [ ] SoundCloud та Spotify інтеграція
- [ ] Пошук за жанром та тегами
- [ ] Сповіщення про нові твори
- [ ] Аватари та профілі авторів
- [ ] Деплой на Railway (бекенд) + Vercel (фронтенд)
