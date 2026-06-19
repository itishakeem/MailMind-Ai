import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("lemon_squeezy_customer_id")
    .eq("id", user.id)
    .single();

  const customerId = profile?.lemon_squeezy_customer_id;
  if (!customerId) return NextResponse.json({ error: "No subscription found" }, { status: 404 });

  const res = await fetch(
    `https://api.lemonsqueezy.com/v1/customers/${customerId}`,
    {
      headers: {
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      },
    }
  );

  if (!res.ok) return NextResponse.json({ error: "Failed to fetch portal" }, { status: 500 });

  const json = await res.json();
  const url: string | undefined = json.data?.attributes?.urls?.customer_portal;

  return url
    ? NextResponse.json({ url })
    : NextResponse.json({ error: "Portal URL unavailable" }, { status: 500 });
}
