import Link from "next/link";

export const SETTINGS_TABS = [
  { id: "account", label: "Account" },
  { id: "profile", label: "Producer profile" },
  { id: "templates", label: "Templates" },
  { id: "security", label: "Security" },
  { id: "billing", label: "Billing" },
  { id: "privacy", label: "Privacy" },
  { id: "delete", label: "Delete account" },
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number]["id"];

/** Left-hand section nav for the settings area. Soft-navigates via ?tab=. */
export default function SettingsSidebar({ active }: { active: SettingsTab }) {
  return (
    <nav className="settings-nav" aria-label="Settings sections">
      {SETTINGS_TABS.map((t) => (
        <Link
          key={t.id}
          href={`/settings?tab=${t.id}`}
          scroll={false}
          aria-current={active === t.id ? "page" : undefined}
          className={[
            "settings-nav-link",
            active === t.id ? "is-active" : "",
            t.id === "delete" ? "settings-nav-danger" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
