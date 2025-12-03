-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "admin" BOOLEAN NOT NULL DEFAULT false,
    "default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "verified_at" DATETIME,
    "remember_token" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "users_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dictionaries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "words" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "pronunciation" TEXT,
    "dictionary_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "words_dictionary_id_fkey" FOREIGN KEY ("dictionary_id") REFERENCES "dictionaries" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "classifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "word_classification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "word_id" TEXT NOT NULL,
    "classification_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "word_classification_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "word_classification_classification_id_fkey" FOREIGN KEY ("classification_id") REFERENCES "classifications" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "date" DATETIME,
    "url" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sentences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dictionary_id" TEXT NOT NULL,
    "source_id" TEXT,
    "value" TEXT NOT NULL,
    "english" TEXT NOT NULL,
    "etymology" TEXT,
    "leipzig_glossing" TEXT,
    "audio" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sentences_dictionary_id_fkey" FOREIGN KEY ("dictionary_id") REFERENCES "dictionaries" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sentences_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "series" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "series_id" TEXT NOT NULL,
    "season_number" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "seasons_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "season_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "season_number" INTEGER NOT NULL,
    "series_number" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "episodes_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "speakers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "series_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "speakers_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "episode_sentence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "episode_id" TEXT NOT NULL,
    "sentence_id" TEXT NOT NULL,
    "speaker_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "episode_sentence_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "episode_sentence_sentence_id_fkey" FOREIGN KEY ("sentence_id") REFERENCES "sentences" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "episode_sentence_speaker_id_fkey" FOREIGN KEY ("speaker_id") REFERENCES "speakers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "translations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "word_source_id" TEXT NOT NULL,
    "word_target_id" TEXT NOT NULL,
    "source_id" TEXT,
    "etymology" TEXT DEFAULT 'unknown',
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "translations_word_source_id_fkey" FOREIGN KEY ("word_source_id") REFERENCES "words" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "translations_word_target_id_fkey" FOREIGN KEY ("word_target_id") REFERENCES "words" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "translations_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "word_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "trigedasleng" TEXT,
    "translation" TEXT,
    "classification" TEXT,
    "etymology" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "dictionary_type" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "word_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "word_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "votes_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "word_requests" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "comments_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "word_requests" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "votes_user_id_request_id_key" ON "votes"("user_id", "request_id");
