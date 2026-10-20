import { describe, expect, it } from "vitest";
import { CATALOG } from "@/lib/catalog";
import {
  exerciseQuerySchema,
  filterExercises,
  parseProviderExercises,
  providerPath,
} from "@/lib/exercise-api";

describe("exercise search", () => {
  it("combines text, muscle and equipment filters, ignoring accents", () => {
    const query = exerciseQuerySchema.parse({
      bodyPart: "upper arms",
      equipment: "cable",
      q: "triceps",
    });
    const found = filterExercises(CATALOG, query);
    expect(found.map((e) => e.id)).toEqual(["local-triceps"]);
    expect(filterExercises(CATALOG, { ...query, equipment: "barbell" })).toHaveLength(0);
  });
  it("rejects unbounded limits, negative offsets and arbitrary filters", () => {
    for (const query of [
      { limit: "100000" },
      { offset: "-1" },
      { limit: "abc" },
      { equipment: "<script>" },
      { bodyPart: "invalid" },
    ]) {
      expect(exerciseQuerySchema.safeParse(query).success).toBe(false);
    }
  });
  it("builds fixed provider paths and rejects malformed upstream data", () => {
    expect(providerPath(exerciseQuerySchema.parse({ bodyPart: "upper legs" }))).toBe(
      "/exercises/bodyPart/upper%20legs",
    );
    expect(() => parseProviderExercises({ message: "quota exceeded" })).toThrow();
    expect(() => parseProviderExercises([{ id: "x", name: "Broken" }])).toThrow();
  });
});
