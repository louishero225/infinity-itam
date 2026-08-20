import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isPublicPath(pathname: string) {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  );
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      (c) =>
        c.name.includes("-auth-token") ||
        (c.name.startsWith("sb-") && c.name.includes("auth"))
    );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;

  if (!url || !anonKey) {
    if (!isPublicPath(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  let user = null as { id: string } | null;
  let authFailedTransient = false;

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // Timeout / réseau : ne pas déconnecter si un cookie de session existe
      authFailedTransient = hasSupabaseAuthCookie(request);
    } else {
      user = data.user;
    }
  } catch {
    authFailedTransient = hasSupabaseAuthCookie(request);
  }

  if (!user && !authFailedTransient && !isPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    if (pathname !== "/") {
      redirectUrl.searchParams.set("redirectTo", pathname);
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname.startsWith("/login")) {
    const redirectTo = request.nextUrl.searchParams.get("redirectTo") || "/dashboard";
    const safeRedirect =
      redirectTo.startsWith("/") && !redirectTo.startsWith("//")
        ? redirectTo
        : "/dashboard";
    return NextResponse.redirect(new URL(safeRedirect, request.url));
  }

  return supabaseResponse;
}
