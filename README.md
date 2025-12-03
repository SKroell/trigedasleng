# Trigedasleng Dictionary (React Router v7 + Prisma)

This is a recreation of the Trigedasleng project using React Router v7 (Remix) and Prisma.

## Setup

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Set up the database:
    -   Update your `.env` file to point to the SQLite database:
        ```
        DATABASE_URL="file:./dev.db"
        ```
    -   Run Prisma migrations/push:
        ```bash
        npx prisma db push
        ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

## Features

-   **Dictionary**: Browse words.
-   **Search**: Search for words and translations.
-   **Translations**: View and add translations (Translation submission logic pending detailed requirements, currently just viewing).
-   **Sources**: View sources.
-   **Auth**: Login and Signup (Session-based).

## Notes

-   Password hashing is currently a placeholder (`TODO` in code) due to environment limitations installing `bcryptjs`. Please run `npm install bcryptjs @types/bcryptjs` and uncomment the hashing logic in `app/routes/auth/*.tsx` for security.
