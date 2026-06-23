import { auth } from "@/lib/auth";
import { NavBar } from "@/components/nav-bar";

const links = [
  { href: "/", label: "Assemblies" },
  { href: "/partners", label: "Partners" },
  { href: "/questionnaire", label: "Questionnaire" },
];

export async function Nav() {
  const session = await auth();
  if (!session?.user) return null;

  const gatewayUrl = process.env.GATEWAY_URL ?? "https://meavo.app";

  return (
    <NavBar
      links={links}
      gatewayUrl={gatewayUrl}
      userName={session.user.name}
      userEmail={session.user.email}
      userImage={session.user.image}
    />
  );
}
