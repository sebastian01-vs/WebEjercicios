import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { CATALOG } from "@/lib/catalog";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";
import { GET } from "@/app/api/exercises/route";

const mockClient = vi.mocked(createClient);
const request = (query = "") => new NextRequest(`https://pulso.example/api/exercises${query}`);
function authenticated(user: { id: string } | null) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
  } as unknown as NonNullable<Awaited<ReturnType<typeof createClient>>>;
}

beforeEach(() => {
  vi.stubEnv("EXERCISE_DB_API_KEY", "");
  vi.stubEnv("EXERCISE_DB_HOST", "exercisedb.p.rapidapi.com");
  mockClient.mockResolvedValue(null);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("exercise route security and availability", () => {
  it("serves a paginated starter catalogue and validates query bounds", async () => {
    const response = await GET(request("?bodyPart=chest&limit=1"));
    const data = await response.json();
    expect(data.source).toBe("sample");
    expect(data.exercises).toHaveLength(1);
    expect(data.hasMore).toBe(true);
    expect(data.nextOffset).toBe(1);
    expect((await GET(request("?limit=100000"))).status).toBe(400);
  });
  it("does not call the paid provider in unauthenticated guest mode", async () => {
    vi.stubEnv("EXERCISE_DB_API_KEY", "test-secret-key");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect((await (await GET(request())).json()).source).toBe("sample");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it("requires an authenticated session when the provider is enabled", async () => {
    vi.stubEnv("EXERCISE_DB_API_KEY", "test-secret-key");
    mockClient.mockResolvedValue(authenticated(null));
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect((await GET(request())).status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it("keeps credentials on the server and requests a 24-hour upstream cache", async () => {
    vi.stubEnv("EXERCISE_DB_API_KEY", "test-secret-key");
    mockClient.mockResolvedValue(authenticated({ id: "user-a" }));
    const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify([CATALOG[0]])));
    vi.stubGlobal("fetch", fetchSpy);
    const response = await GET(request("?bodyPart=chest&equipment=barbell&limit=1"));
    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain("test-secret-key");
    const [url, options] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe(
      "https://exercisedb.p.rapidapi.com/exercises/bodyPart/chest?limit=1&offset=0",
    );
    expect(options.next).toEqual({ revalidate: 86400 });
    expect(options.headers["X-RapidAPI-Key"]).toBe("test-secret-key");
  });
  it("refuses unknown hosts and sanitizes upstream failures", async () => {
    vi.stubEnv("EXERCISE_DB_API_KEY", "test-secret-key");
    mockClient.mockResolvedValue(authenticated({ id: "user-a" }));
    vi.stubEnv("EXERCISE_DB_HOST", "malicious.example");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect((await GET(request())).status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.stubEnv("EXERCISE_DB_HOST", "exercisedb.p.rapidapi.com");
    fetchSpy.mockRejectedValue(new Error("Secret diagnostic test-secret-key"));
    const response = await GET(request());
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("test-secret-key");
  });
});
