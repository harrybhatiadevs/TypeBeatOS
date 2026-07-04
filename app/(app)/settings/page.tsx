import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlanState } from "@/lib/billing";
import { getTemplateState } from "@/lib/actions/packages";
import { youtubeConfigured } from "@/lib/youtube";
import { updateAccountName } from "@/lib/actions/account";
import FormSubmitButton from "@/app/FormSubmitButton";
import ThemeToggle from "@/app/ThemeToggle";
import DeleteAccount from "./DeleteAccount";
import SettingsSidebar, { SETTINGS_TABS, type SettingsTab } from "./SettingsSidebar";
import ProfileSection from "./ProfileSection";
import TemplatesSection from "./TemplatesSection";

export const dynamic = "force-dynamic";

const TAB_IDS = SETTINGS_TABS.map((t) => t.id) as SettingsTab[];

const SAVED_MESSAGES: Record<string, string> = {
  account: "✓ Account updated",
  password: "✓ Password changed — other devices were signed out",
  profile: "✓ Profile saved",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    saved?: string;
    error?: string;
    yt_connected?: string;
    yt_error?: string;
  }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const tab: SettingsTab = TAB_IDS.includes(sp.tab as SettingsTab)
    ? (sp.tab as SettingsTab)
    : "account";

  // Fetch only what the active tab needs.
  const profileData =
    tab === "profile"
      ? await db.youTubeAccount.findUnique({ where: { userId: user.id } })
      : null;
  const templateState = tab === "templates" ? await getTemplateState() : null;
  const planState = tab === "billing" ? await getPlanState(user) : null;

  return (
    <>
      <h1 className="page-title">Settings</h1>
      <p className="page-sub">Your account, producer profile, templates, and data.</p>

      <div className="settings-layout">
        <SettingsSidebar active={tab} />

        <div className="settings-content">
          {sp.error && <div className="form-error">{sp.error}</div>}
          {sp.saved && SAVED_MESSAGES[sp.saved] && (
            <p className="form-saved" style={{ marginBottom: "1.25rem" }}>
              {SAVED_MESSAGES[sp.saved]}
            </p>
          )}

          {tab === "account" && (
            <form action={updateAccountName}>
              <div className="card">
                <h3>Account</h3>
                <div className="form-grid">
                  <div className="form-field full">
                    <label htmlFor="name">Name</label>
                    <input id="name" name="name" type="text" defaultValue={user.name || ""} placeholder="Your name" required />
                  </div>
                  <div className="form-field full">
                    <label htmlFor="email">
                      Email{" "}
                      {user.emailVerified ? (
                        <span className="badge badge-uploaded">verified</span>
                      ) : (
                        <span className="badge badge-ready">unverified</span>
                      )}
                    </label>
                    <input id="email" type="email" value={user.email} disabled aria-describedby="email-note" />
                    <span id="email-note" className="tb-helper" style={{ fontSize: "0.78rem" }}>
                      Email is your sign-in identity and can&apos;t be changed here yet.
                    </span>
                  </div>
                </div>
                <div className="form-actions">
                  <FormSubmitButton pendingLabel="Saving…">Save account</FormSubmitButton>
                </div>
              </div>
            </form>
          )}

          {tab === "profile" && (
            <ProfileSection
              profile={user.profile}
              youtube={profileData}
              configured={youtubeConfigured()}
              saved={sp.saved === "profile"}
              ytConnected={sp.yt_connected === "1"}
              ytError={sp.yt_error}
            />
          )}

          {tab === "templates" && templateState && (
            <TemplatesSection
              initialTemplates={templateState.templates}
              planId={templateState.planId}
              limit={Number.isFinite(templateState.limit) ? templateState.limit : null}
            />
          )}

          {tab === "security" && (
            <form method="POST" action="/api/account/password">
              <div className="card">
                <h3>Security</h3>
                <div className="form-grid">
                  <div className="form-field full">
                    <label htmlFor="currentPassword">Current password</label>
                    <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
                  </div>
                  <div className="form-field">
                    <label htmlFor="newPassword">New password</label>
                    <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
                  </div>
                  <div className="form-field">
                    <label htmlFor="confirmPassword">Confirm new password</label>
                    <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
                  </div>
                </div>
                <div className="form-actions">
                  <FormSubmitButton pendingLabel="Changing…">Change password</FormSubmitButton>
                </div>
              </div>
            </form>
          )}

          {tab === "appearance" && (
            <div className="card">
              <h3>Appearance</h3>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <p style={{ fontSize: "0.95rem", color: "var(--muted)", maxWidth: "34rem" }}>
                  After-hours dark is the TypeBeatOS default. Flip to daylight if you work in the sun —
                  your choice sticks on this device.
                </p>
                <ThemeToggle />
              </div>
            </div>
          )}

          {tab === "billing" && planState && (
            <div className="card">
              <h3>Billing</h3>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <p style={{ fontSize: "0.95rem", color: "var(--muted)" }}>
                  <strong style={{ color: "var(--ink)" }}>{planState.plan.label}</strong>
                  {" · "}
                  {planState.used} / {planState.isAdmin ? "unlimited" : planState.limit} upload packs this month
                </p>
                <Link href="/billing" className="btn btn-ghost btn-sm">Manage plan &amp; billing</Link>
              </div>
            </div>
          )}

          {tab === "privacy" && (
            <div className="card">
              <h3>Privacy</h3>
              <p style={{ fontSize: "0.95rem", color: "var(--muted)", marginBottom: "0.9rem", maxWidth: "44rem" }}>
                Your beats and generated packages are private to your account. We never post to your
                YouTube channel except uploads you schedule yourself, and you can disconnect the channel
                any time from your <Link href="/settings?tab=profile">producer profile</Link>.
              </p>
              <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", fontSize: "0.9rem" }}>
                <Link href="/privacy">Privacy policy</Link>
                <Link href="/terms">Terms of service</Link>
              </div>
            </div>
          )}

          {tab === "delete" && (
            <div className="card" style={{ borderColor: "var(--danger-border)" }}>
              <h3 style={{ color: "var(--danger-ink)" }}>Delete account</h3>
              <DeleteAccount email={user.email} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
