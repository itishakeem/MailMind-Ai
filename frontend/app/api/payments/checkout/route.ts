import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const LS_API = "https://api.lemonsqueezy.com/v1";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("email, plan")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (profile.plan !== "free") return NextResponse.json({ error: "Already on Pro" }, { status: 400 });

  const res = await fetch(`${LS_API}/checkouts`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: profile.email,
            custom: { user_id: user.id },
          },
        },
        relationships: {
          store:   { data: { type: "stores",   id: process.env.LEMONSQUEEZY_STORE_ID } },
          variant: { data: { type: "variants", id: process.env.LEMONSQUEEZY_PRO_VARIANT_ID } },
        },
      },
    }),
  });

  if (!res.ok) {
    console.error("[LS checkout]", await res.text());
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }

  const json = await res.json();
  const url: string | undefined = json.data?.attributes?.url;

  return url
    ? NextResponse.json({ url })
    : NextResponse.json({ error: "No checkout URL returned" }, { status: 500 });
}
