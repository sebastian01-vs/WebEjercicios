import { describe, expect, it } from "vitest";
import { CATALOG, emptyPlan, starterPlan, toPlanned } from "@/lib/catalog";
import { weeklyPlanSchema } from "@/lib/types";
import { dayDate, localDateKey, mondayOf } from "@/lib/dates";

describe("weekly plan validation", () => {
  it("accepts empty and starter weeks", () => {
    expect(weeklyPlanSchema.safeParse(emptyPlan()).success).toBe(true);
    expect(weeklyPlanSchema.safeParse(starterPlan()).success).toBe(true);
  });
  it("rejects repeated days, duplicate row IDs and inconsistent ordering", () => {
    const plan = starterPlan();
    plan[1].day_of_week = 1;
    expect(weeklyPlanSchema.safeParse(plan).success).toBe(false);
    const repeated = starterPlan();
    repeated[0].exercises[1].id = repeated[0].exercises[0].id;
    expect(weeklyPlanSchema.safeParse(repeated).success).toBe(false);
    const wrongOrder = starterPlan();
    wrongOrder[0].exercises.reverse();
    expect(weeklyPlanSchema.safeParse(wrongOrder).success).toBe(false);
    const wrongDayOrder = emptyPlan();
    wrongDayOrder.reverse();
    expect(weeklyPlanSchema.safeParse(wrongDayOrder).success).toBe(false);
  });
  it("rejects zero sets, malformed reps, unsafe media and oversized days", () => {
    const plan = emptyPlan();
    const exercise = toPlanned(CATALOG[0], 0);
    plan[0].exercises = [{ ...exercise, sets: 0 }];
    expect(weeklyPlanSchema.safeParse(plan).success).toBe(false);
    plan[0].exercises = [{ ...exercise, reps: "ten" }];
    expect(weeklyPlanSchema.safeParse(plan).success).toBe(false);
    plan[0].exercises = [{ ...exercise, gif_url: "javascript:alert(1)" }];
    expect(weeklyPlanSchema.safeParse(plan).success).toBe(false);
    plan[0].exercises = Array.from({ length: 31 }, (_, i) => toPlanned(CATALOG[0], i));
    expect(weeklyPlanSchema.safeParse(plan).success).toBe(false);
  });
  it("accepts repetition ranges and duration", () => {
    for (const reps of ["10", "8-12", "8–12", "30s"]) {
      const plan = emptyPlan();
      plan[0].exercises = [{ ...toPlanned(CATALOG[0], 0), reps }];
      expect(weeklyPlanSchema.safeParse(plan).success).toBe(true);
    }
  });
});

describe("local calendar dates", () => {
  it("keeps Sunday in the previous Monday's week, including year boundaries", () => {
    const monday = mondayOf(new Date(2027, 0, 3, 9));
    expect(localDateKey(monday)).toBe("2026-12-28");
    expect(localDateKey(dayDate(monday, 6))).toBe("2027-01-03");
  });
});
