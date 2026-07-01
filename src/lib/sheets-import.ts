import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { isInternalPartnerName, slugifyPartnerName } from "@/lib/slug";

const SHEET_COLUMNS = {
  date: 0, // A
  deal: 1, // B
  market: 2, // C
  client: 3, // D
  type: 4, // E — client type
  deliveryDoneBy: 8, // I — delivery company
  installDoneBy: 9, // J
} as const;

function parseSheetDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/[/.-]/);
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map((p) => parseInt(p, 10));
  if (!d || !m || !y) return null;
  const year = y < 100 ? 2000 + y : y;
  const date = new Date(Date.UTC(year, m - 1, d));
  return Number.isNaN(date.getTime()) ? null : date;
}

async function getSheetsClient() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");

  const credentials = JSON.parse(json) as {
    client_email: string;
    private_key: string;
  };

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return google.sheets({ version: "v4", auth });
}

async function ensurePartner(name: string) {
  const trimmed = name.trim();
  if (!trimmed || isInternalPartnerName(trimmed)) return null;

  const slugBase = slugifyPartnerName(trimmed);
  if (!slugBase) return null;

  const existing = await prisma.assemblyPartner.findFirst({
    where: {
      OR: [{ name: trimmed }, { slug: slugBase }],
    },
  });
  if (existing) return existing;

  let slug = slugBase;
  let suffix = 2;
  while (await prisma.assemblyPartner.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${suffix}`;
    suffix += 1;
  }

  return prisma.assemblyPartner.create({
    data: {
      name: trimmed,
      slug,
      isInternal: false,
    },
  });
}

export async function importAssembliesFromSheet(): Promise<{
  imported: number;
  partnersCreated: number;
}> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const tabName = process.env.GOOGLE_SHEETS_TAB_NAME ?? "Deliveries";
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not set");

  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${tabName}'!A:Z`,
  });

  const rows = response.data.values ?? [];
  if (rows.length < 2) {
    await prisma.sheetImportState.upsert({
      where: { id: "default" },
      create: { id: "default", lastRunAt: new Date(), rowCount: 0 },
      update: { lastRunAt: new Date(), rowCount: 0, errorMessage: null },
    });
    return { imported: 0, partnersCreated: 0 };
  }

  let imported = 0;
  let partnersCreated = 0;
  const partnerCache = new Map<string, string | null>();

  async function partnerIdForName(name: string): Promise<string | null> {
    const key = name.trim().toLowerCase();
    if (partnerCache.has(key)) return partnerCache.get(key) ?? null;
    const before = await prisma.assemblyPartner.count();
    const partner = await ensurePartner(name);
    const after = await prisma.assemblyPartner.count();
    if (after > before) partnersCreated += 1;
    const id = partner?.id ?? null;
    partnerCache.set(key, id);
    return id;
  }

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    const dealId = String(row[SHEET_COLUMNS.deal] ?? "").trim();
    if (!dealId) continue;

    const installName = String(row[SHEET_COLUMNS.installDoneBy] ?? "").trim();
    const deliveryName = String(row[SHEET_COLUMNS.deliveryDoneBy] ?? "").trim();
    const installPartnerId = installName ? await partnerIdForName(installName) : null;

    const assemblyDate = parseSheetDate(String(row[SHEET_COLUMNS.date] ?? ""));

    await prisma.assembly.upsert({
      where: { dealId },
      create: {
        dealId,
        assemblyDate,
        market: String(row[SHEET_COLUMNS.market] ?? "").trim(),
        clientName: String(row[SHEET_COLUMNS.client] ?? "").trim(),
        channelType: String(row[SHEET_COLUMNS.type] ?? "").trim(),
        deliveryPartnerName: deliveryName,
        installPartnerName: installName,
        installPartnerId,
        lastImportedAt: new Date(),
      },
      update: {
        assemblyDate,
        market: String(row[SHEET_COLUMNS.market] ?? "").trim(),
        clientName: String(row[SHEET_COLUMNS.client] ?? "").trim(),
        channelType: String(row[SHEET_COLUMNS.type] ?? "").trim(),
        deliveryPartnerName: deliveryName,
        installPartnerName: installName,
        installPartnerId,
        lastImportedAt: new Date(),
      },
    });
    imported += 1;
  }

  await prisma.sheetImportState.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      lastRunAt: new Date(),
      rowCount: imported,
      errorMessage: null,
    },
    update: {
      lastRunAt: new Date(),
      rowCount: imported,
      errorMessage: null,
    },
  });

  return { imported, partnersCreated };
}
