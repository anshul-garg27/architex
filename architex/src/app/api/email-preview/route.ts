import { NextRequest, NextResponse } from "next/server";
import {
  welcomeEmail,
  weeklyDigestEmail,
  streakReminderEmail,
  achievementEmail,
} from "@/lib/email/templates";

const TEMPLATES: Record<string, () => { subject: string; html: string }> = {
  welcome: () => welcomeEmail("Alex"),
  digest: () =>
    weeklyDigestEmail({ challengesCompleted: 12, streak: 7, dueReviews: 3 }),
  streak: () => streakReminderEmail("Alex", 14),
  achievement: () =>
    achievementEmail("Alex", "System Design Master", 500),
};

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Email preview is only available in development" },
      { status: 403 }
    );
  }

  const template = request.nextUrl.searchParams.get("template");

  if (!template || !TEMPLATES[template]) {
    const available = Object.keys(TEMPLATES).join(", ");
    return new NextResponse(
      `<html><body style="font-family:system-ui;padding:40px;">
        <h1>Email Template Preview</h1>
        <p>Pass <code>?template=NAME</code> where NAME is one of: <strong>${available}</strong></p>
        <ul>${Object.keys(TEMPLATES)
          .map(
            (t) =>
              `<li><a href="?template=${t}">${t}</a></li>`
          )
          .join("")}</ul>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const { html } = TEMPLATES[template]();
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
