import type { NextRequest } from "next/server";
import { createClient } from "./supabase/middleware";

export function middleware(request: NextRequest) {
  const { supabaseResponse } = createClient(request);
  return supabaseResponse;
}

