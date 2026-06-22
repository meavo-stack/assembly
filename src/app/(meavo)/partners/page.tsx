import { requireMeavoAccess } from "@/lib/meavo-auth";
import { prisma } from "@/lib/prisma";
import {
  createPartner,
  setPartnerAccessCode,
  updatePartnerSlug,
} from "@/app/actions/meavo";
import { Button, Card, Input, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  await requireMeavoAccess();

  const partners = await prisma.assemblyPartner.findMany({
    where: { isInternal: false },
    orderBy: { name: "asc" },
    include: { _count: { select: { assemblies: true } } },
  });

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3001";

  return (
    <>
      <PageHeader
        title="Partners"
        description="Each partner gets a URL and access code for their install questionnaire portal."
      />

      <Card className="mb-6">
        <h2 className="font-medium text-slate-900">Add partner</h2>
        <form action={createPartner} className="mt-4 grid gap-4 sm:grid-cols-3">
          <Input label="Name" name="name" required placeholder="Alliance" />
          <Input label="Access code" name="code" required placeholder="Set a code" />
          <div className="flex items-end">
            <Button type="submit">Add partner</Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4">
        {partners.map((partner) => (
          <Card key={partner.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">{partner.name}</p>
                <p className="text-sm text-slate-600">
                  {partner._count.assemblies} assemblies ·{" "}
                  <a
                    href={`${baseUrl}/${partner.slug}`}
                    className="text-brand-700 underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {baseUrl.replace(/^https?:\/\//, "")}/{partner.slug}
                  </a>
                </p>
              </div>
              <span className="text-xs text-slate-500">
                {partner.codeHash ? "Code set" : "No code yet"}
              </span>
            </div>

            <form action={setPartnerAccessCode} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="partnerId" value={partner.id} />
              <Input label="New access code" name="code" placeholder="Leave blank to keep unchanged" />
              <div className="flex items-end">
                <Button type="submit" variant="secondary">
                  Update code
                </Button>
              </div>
            </form>

            <form action={updatePartnerSlug} className="mt-3 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="partnerId" value={partner.id} />
              <Input label="URL slug" name="slug" defaultValue={partner.slug} required />
              <div className="flex items-end">
                <Button type="submit" variant="ghost">
                  Update slug
                </Button>
              </div>
            </form>
          </Card>
        ))}
      </div>
    </>
  );
}
