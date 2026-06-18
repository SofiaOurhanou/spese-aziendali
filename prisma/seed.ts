import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient, Ruolo, StatoRichiesta } from "../app/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PASSWORD_TEST = "Password123!";

async function main() {
  console.log("Pulizia dati esistenti...");
  await prisma.richiestaRimborso.deleteMany();
  await prisma.categoriaSpesa.deleteMany();
  await prisma.utente.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD_TEST, 10);

  console.log("Creazione utenti...");
  const mario = await prisma.utente.create({
    data: {
      nome: "Mario",
      cognome: "Rossi",
      email: "mario.rossi@azienda.it",
      password: passwordHash,
      ruolo: Ruolo.DIPENDENTE,
    },
  });

  const laura = await prisma.utente.create({
    data: {
      nome: "Laura",
      cognome: "Bianchi",
      email: "laura.bianchi@azienda.it",
      password: passwordHash,
      ruolo: Ruolo.DIPENDENTE,
    },
  });

  const admin = await prisma.utente.create({
    data: {
      nome: "Giuseppe",
      cognome: "Verdi",
      email: "admin.verdi@azienda.it",
      password: passwordHash,
      ruolo: Ruolo.RESPONSABILE_AMMINISTRATIVO,
    },
  });

  console.log("Creazione categorie...");
  const trasferta = await prisma.categoriaSpesa.create({ data: { descrizione: "Trasferta" } });
  const pasti = await prisma.categoriaSpesa.create({ data: { descrizione: "Pasti" } });
  const pedaggi = await prisma.categoriaSpesa.create({ data: { descrizione: "Pedaggi" } });
  const parcheggio = await prisma.categoriaSpesa.create({ data: { descrizione: "Parcheggio" } });
  const materiali = await prisma.categoriaSpesa.create({ data: { descrizione: "Materiali ufficio" } });

  console.log("Creazione richieste di rimborso...");
  await prisma.richiestaRimborso.createMany({
    data: [
      {
        dataInserimento: new Date("2026-04-10"),
        dataSpesa: new Date("2026-04-08"),
        importo: 85.5,
        descrizione: "Pranzo con cliente durante visita commerciale",
        riferimentoGiustificativo: "SCN-2026-0412",
        stato: StatoRichiesta.LIQUIDATA,
        dipendenteId: mario.id,
        categoriaId: pasti.id,
        dataValutazione: new Date("2026-04-12"),
        responsabileValutazioneId: admin.id,
        dataLiquidazione: new Date("2026-04-20"),
      },
      {
        dataInserimento: new Date("2026-04-15"),
        dataSpesa: new Date("2026-04-14"),
        importo: 45.0,
        descrizione: "Pedaggio autostrada Milano-Torino",
        riferimentoGiustificativo: "PED-88421",
        stato: StatoRichiesta.APPROVATA,
        dipendenteId: mario.id,
        categoriaId: pedaggi.id,
        dataValutazione: new Date("2026-04-16"),
        responsabileValutazioneId: admin.id,
      },
      {
        dataInserimento: new Date("2026-05-02"),
        dataSpesa: new Date("2026-05-01"),
        importo: 320.0,
        descrizione: "Biglietto treno AV per riunione a Roma",
        riferimentoGiustificativo: "TRN-55231",
        stato: StatoRichiesta.IN_ATTESA,
        dipendenteId: mario.id,
        categoriaId: trasferta.id,
      },
      {
        dataInserimento: new Date("2026-05-10"),
        dataSpesa: new Date("2026-05-09"),
        importo: 12.0,
        descrizione: "Parcheggio presso sede cliente",
        stato: StatoRichiesta.RIFIUTATA,
        dipendenteId: mario.id,
        categoriaId: parcheggio.id,
        dataValutazione: new Date("2026-05-11"),
        responsabileValutazioneId: admin.id,
        motivazioneRifiuto: "Manca giustificativo del parcheggio",
      },
      {
        dataInserimento: new Date("2026-06-01"),
        dataSpesa: new Date("2026-05-28"),
        importo: 28.9,
        descrizione: "Cancelleria per ufficio",
        riferimentoGiustificativo: "FAT-99102",
        stato: StatoRichiesta.IN_ATTESA,
        dipendenteId: mario.id,
        categoriaId: materiali.id,
      },
    ],
  });

  await prisma.richiestaRimborso.createMany({
    data: [
      {
        dataInserimento: new Date("2026-05-05"),
        dataSpesa: new Date("2026-05-04"),
        importo: 150.0,
        descrizione: "Hotel per trasferta a Bologna",
        riferimentoGiustificativo: "HTL-2201",
        stato: StatoRichiesta.LIQUIDATA,
        dipendenteId: laura.id,
        categoriaId: trasferta.id,
        dataValutazione: new Date("2026-05-07"),
        responsabileValutazioneId: admin.id,
        dataLiquidazione: new Date("2026-05-15"),
      },
      {
        dataInserimento: new Date("2026-05-12"),
        dataSpesa: new Date("2026-05-11"),
        importo: 35.0,
        descrizione: "Cena di lavoro con fornitore",
        stato: StatoRichiesta.APPROVATA,
        dipendenteId: laura.id,
        categoriaId: pasti.id,
        dataValutazione: new Date("2026-05-13"),
        responsabileValutazioneId: admin.id,
      },
      {
        dataInserimento: new Date("2026-05-20"),
        dataSpesa: new Date("2026-05-19"),
        importo: 18.5,
        descrizione: "Pedaggio ritorno da Bologna",
        stato: StatoRichiesta.IN_ATTESA,
        dipendenteId: laura.id,
        categoriaId: pedaggi.id,
      },
      {
        dataInserimento: new Date("2026-06-03"),
        dataSpesa: new Date("2026-06-02"),
        importo: 42.0,
        descrizione: "Parcheggio aeroporto Linate",
        riferimentoGiustificativo: "PRK-7781",
        stato: StatoRichiesta.IN_ATTESA,
        dipendenteId: laura.id,
        categoriaId: parcheggio.id,
      },
      {
        dataInserimento: new Date("2026-04-20"),
        dataSpesa: new Date("2026-04-18"),
        importo: 65.0,
        descrizione: "Pranzo team progetto Alpha",
        stato: StatoRichiesta.LIQUIDATA,
        dipendenteId: laura.id,
        categoriaId: pasti.id,
        dataValutazione: new Date("2026-04-22"),
        responsabileValutazioneId: admin.id,
        dataLiquidazione: new Date("2026-04-30"),
      },
    ],
  });

  console.log("Seed completato!");
  console.log("");
  console.log("Credenziali di test (password: Password123!):");
  console.log("  Dipendente: mario.rossi@azienda.it");
  console.log("  Dipendente: laura.bianchi@azienda.it");
  console.log("  Admin:      admin.verdi@azienda.it");
}

main()
  .catch((e) => {
    console.error("Errore durante il seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
