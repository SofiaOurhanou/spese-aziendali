-- CreateEnum
CREATE TYPE "Ruolo" AS ENUM ('DIPENDENTE', 'RESPONSABILE_AMMINISTRATIVO');

-- CreateEnum
CREATE TYPE "StatoRichiesta" AS ENUM ('IN_ATTESA', 'APPROVATA', 'RIFIUTATA', 'LIQUIDATA');

-- CreateTable
CREATE TABLE "Utente" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cognome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "ruolo" "Ruolo" NOT NULL DEFAULT 'DIPENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Utente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaSpesa" (
    "id" SERIAL NOT NULL,
    "descrizione" TEXT NOT NULL,

    CONSTRAINT "CategoriaSpesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RichiestaRimborso" (
    "id" SERIAL NOT NULL,
    "dataInserimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataSpesa" TIMESTAMP(3) NOT NULL,
    "importo" DECIMAL(10,2) NOT NULL,
    "descrizione" TEXT NOT NULL,
    "riferimentoGiustificativo" TEXT,
    "stato" "StatoRichiesta" NOT NULL DEFAULT 'IN_ATTESA',
    "dipendenteId" INTEGER NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "dataValutazione" TIMESTAMP(3),
    "responsabileValutazioneId" INTEGER,
    "motivazioneRifiuto" TEXT,
    "dataLiquidazione" TIMESTAMP(3),

    CONSTRAINT "RichiestaRimborso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utente_email_key" ON "Utente"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaSpesa_descrizione_key" ON "CategoriaSpesa"("descrizione");

-- AddForeignKey
ALTER TABLE "RichiestaRimborso" ADD CONSTRAINT "RichiestaRimborso_dipendenteId_fkey" FOREIGN KEY ("dipendenteId") REFERENCES "Utente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RichiestaRimborso" ADD CONSTRAINT "RichiestaRimborso_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaSpesa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RichiestaRimborso" ADD CONSTRAINT "RichiestaRimborso_responsabileValutazioneId_fkey" FOREIGN KEY ("responsabileValutazioneId") REFERENCES "Utente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
