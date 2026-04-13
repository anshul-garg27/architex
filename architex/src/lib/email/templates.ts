// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const BRAND_COLOR = "#6E56CF";
const BG_COLOR = "#0f1015";
const TEXT_COLOR = "#f4f4f5";
const MUTED_COLOR = "#a1a1aa";

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${BG_COLOR};">
  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;background:${BG_COLOR};color:${TEXT_COLOR};padding:40px;">
    ${content}
    <hr style="border:none;border-top:1px solid #27272a;margin:32px 0 16px;" />
    <p style="font-size:12px;color:${MUTED_COLOR};text-align:center;">
      &copy; ${new Date().getFullYear()} Architex &middot;
      <a href="https://architex.dev" style="color:${MUTED_COLOR};text-decoration:underline;">architex.dev</a>
    </p>
  </div>
</body>
</html>`;
}

function button(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;padding:12px 24px;background:${BRAND_COLOR};color:white;text-decoration:none;border-radius:8px;margin-top:16px;font-weight:600;">${text}</a>`;
}

// ---------------------------------------------------------------------------
// 1. Welcome email
// ---------------------------------------------------------------------------

export function welcomeEmail(userName: string): {
  subject: string;
  html: string;
} {
  return {
    subject: "Welcome to Architex!",
    html: layout(`
      <h1 style="color:${BRAND_COLOR};margin-bottom:8px;">Welcome to Architex, ${userName}!</h1>
      <p>You've joined the most interactive engineering learning platform.</p>
      <h2 style="font-size:18px;margin-top:24px;">Get Started:</h2>
      <ul style="line-height:1.8;">
        <li>Design your first system architecture</li>
        <li>Visualize algorithms step-by-step</li>
        <li>Practice for system design interviews</li>
      </ul>
      ${button("Start Building", "https://architex.dev")}
    `),
  };
}

// ---------------------------------------------------------------------------
// 2. Weekly digest email
// ---------------------------------------------------------------------------

export function weeklyDigestEmail(stats: {
  challengesCompleted: number;
  streak: number;
  dueReviews: number;
}): { subject: string; html: string } {
  return {
    subject: `Your Architex Weekly Digest — ${stats.challengesCompleted} challenges completed`,
    html: layout(`
      <h1 style="color:${BRAND_COLOR};margin-bottom:8px;">Your Week in Review</h1>
      <p>Here's what you accomplished this week on Architex:</p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        <tr>
          <td style="padding:16px;text-align:center;background:#18181b;border-radius:8px 0 0 8px;">
            <div style="font-size:28px;font-weight:700;color:${BRAND_COLOR};">${stats.challengesCompleted}</div>
            <div style="font-size:12px;color:${MUTED_COLOR};margin-top:4px;">Challenges</div>
          </td>
          <td style="padding:16px;text-align:center;background:#18181b;">
            <div style="font-size:28px;font-weight:700;color:${BRAND_COLOR};">${stats.streak}</div>
            <div style="font-size:12px;color:${MUTED_COLOR};margin-top:4px;">Day Streak</div>
          </td>
          <td style="padding:16px;text-align:center;background:#18181b;border-radius:0 8px 8px 0;">
            <div style="font-size:28px;font-weight:700;color:${BRAND_COLOR};">${stats.dueReviews}</div>
            <div style="font-size:12px;color:${MUTED_COLOR};margin-top:4px;">Due Reviews</div>
          </td>
        </tr>
      </table>
      ${stats.dueReviews > 0 ? `<p>You have <strong>${stats.dueReviews}</strong> spaced-repetition reviews waiting.</p>` : "<p>You're all caught up on reviews!</p>"}
      ${button("Continue Learning", "https://architex.dev/dashboard")}
    `),
  };
}

// ---------------------------------------------------------------------------
// 3. Streak reminder email
// ---------------------------------------------------------------------------

export function streakReminderEmail(
  userName: string,
  streakDays: number
): { subject: string; html: string } {
  return {
    subject: `Don't lose your ${streakDays}-day streak!`,
    html: layout(`
      <h1 style="color:${BRAND_COLOR};margin-bottom:8px;">Hey ${userName}, your streak is at risk!</h1>
      <p style="font-size:48px;text-align:center;margin:24px 0;">🔥</p>
      <p style="text-align:center;font-size:20px;font-weight:700;">
        <span style="color:${BRAND_COLOR};">${streakDays}</span> day streak
      </p>
      <p>Complete just one challenge today to keep your momentum going. Even a quick 5-minute review counts!</p>
      ${button("Keep Your Streak", "https://architex.dev/challenges")}
    `),
  };
}

// ---------------------------------------------------------------------------
// 4. Achievement unlock email
// ---------------------------------------------------------------------------

export function achievementEmail(
  userName: string,
  achievementName: string,
  xpReward: number
): { subject: string; html: string } {
  return {
    subject: `Achievement Unlocked: ${achievementName}`,
    html: layout(`
      <h1 style="color:${BRAND_COLOR};margin-bottom:8px;">Congratulations, ${userName}!</h1>
      <div style="text-align:center;margin:24px 0;padding:32px;background:#18181b;border-radius:12px;border:1px solid #27272a;">
        <p style="font-size:48px;margin:0 0 12px;">🏆</p>
        <h2 style="color:${BRAND_COLOR};margin:0 0 8px;font-size:22px;">${achievementName}</h2>
        <p style="color:${MUTED_COLOR};margin:0;">+${xpReward} XP earned</p>
      </div>
      <p>Keep pushing your limits — the next milestone is within reach.</p>
      ${button("View Achievements", "https://architex.dev/profile/achievements")}
    `),
  };
}
