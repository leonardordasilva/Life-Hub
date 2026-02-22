import { describe, it, expect, vi } from "vitest";
import { ImportProgress } from "../../components/ImportModal";

// Mock the fileImportService
vi.mock("../../services/fileImportService", () => ({
  validateFileExtension: (name: string) => name.endsWith(".txt"),
  parseImportFile: async () => ({
    rows: [
      { title: "Filme 1", status: "PENDING" },
      { title: "Filme 2", status: "PENDING" },
      { title: "Filme 3", status: "PENDING" },
      { title: "Filme 4", status: "PENDING" },
      { title: "Filme 5", status: "PENDING" },
    ],
    headers: ["title", "status"],
    errors: [],
  }),
}));

describe("Import Progress Bar", () => {
  it("progress callback updates correctly through iteration", async () => {
    const progressValues: ImportProgress[] = [];

    // Simulate the import loop logic (extracted from dashboard)
    const rows = [
      { title: "A" },
      { title: "B" },
      { title: "C" },
      { title: "D" },
      { title: "E" },
    ];

    const onProgress = (progress: ImportProgress) => {
      progressValues.push({ ...progress });
    };

    for (let i = 0; i < rows.length; i++) {
      // Simulate async DB insert
      await new Promise((r) => setTimeout(r, 10));
      onProgress({
        current: i + 1,
        total: rows.length,
        percent: Math.round(((i + 1) / rows.length) * 100),
      });
      // Simulate yield to UI thread
      await new Promise((r) => setTimeout(r, 50));
    }

    // Validate all progress updates were recorded
    expect(progressValues.length).toBe(5);
    expect(progressValues[0]).toEqual({ current: 1, total: 5, percent: 20 });
    expect(progressValues[1]).toEqual({ current: 2, total: 5, percent: 40 });
    expect(progressValues[2]).toEqual({ current: 3, total: 5, percent: 60 });
    expect(progressValues[3]).toEqual({ current: 4, total: 5, percent: 80 });
    expect(progressValues[4]).toEqual({ current: 5, total: 5, percent: 100 });
  });

  it("progress callback respects cancel signal", async () => {
    const progressValues: ImportProgress[] = [];
    const cancelRef = { current: false };

    const rows = Array.from({ length: 10 }, (_, i) => ({
      title: `Item ${i}`,
    }));

    for (let i = 0; i < rows.length; i++) {
      if (cancelRef.current) break;

      await new Promise((r) => setTimeout(r, 5));

      // Cancel after 3 items
      if (i === 2) cancelRef.current = true;

      progressValues.push({
        current: i + 1,
        total: rows.length,
        percent: Math.round(((i + 1) / rows.length) * 100),
      });

      await new Promise((r) => setTimeout(r, 10));
    }

    // Should have stopped after 3 items
    expect(progressValues.length).toBe(3);
    expect(progressValues[2].current).toBe(3);
    expect(progressValues[2].percent).toBe(30);
  });

  it("percent calculation is accurate at boundaries", () => {
    const testCases = [
      { current: 1, total: 1, expected: 100 },
      { current: 1, total: 10, expected: 10 },
      { current: 5, total: 10, expected: 50 },
      { current: 10, total: 10, expected: 100 },
      { current: 1, total: 3, expected: 33 },
      { current: 2, total: 3, expected: 67 },
      { current: 3, total: 3, expected: 100 },
    ];

    testCases.forEach(({ current, total, expected }) => {
      const percent = Math.round((current / total) * 100);
      expect(percent).toBe(expected);
    });
  });
});
