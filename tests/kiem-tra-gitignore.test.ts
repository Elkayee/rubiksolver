import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Kiem tra cau hinh .gitignore", () => {
  it("phai bo qua cac tep va thu muc rac, bao mat, build va IDE", () => {
    // 1. Doc noi dung tep .gitignore tu thu muc goc
    const duong_dan: string = path.resolve(__dirname, "../.gitignore");
    const nd: string = fs.readFileSync(duong_dan, "utf-8");

    // 2. Tach cac dong trong tep
    const ds_dong: string[] = nd.split("\n").map((dong: string) => dong.trim());

    // 3. Danh sach cac mau bat buoc phai co trong .gitignore
    const ds_mau_cam: string[] = [
      "node_modules/",
      "dist/",
      ".env",
      "Thumbs.db",
      ".DS_Store",
      ".idea/",
      "*.log",
    ];

    // 4. Kiem tra tung mau co ton tai trong danh sach dong khong
    for (const mau of ds_mau_cam) {
      const ton_tai: boolean = ds_dong.some((dong: string) => dong.startsWith(mau) || dong === mau);
      expect(ton_tai).toBe(true);
    }
  });

  it("khong duoc chua cac thu muc ma nguon chinh", () => {
    // 1. Doc noi dung tep .gitignore
    const duong_dan: string = path.resolve(__dirname, "../.gitignore");
    const nd: string = fs.readFileSync(duong_dan, "utf-8");
    const ds_dong: string[] = nd.split("\n").map((dong: string) => dong.trim());

    // 2. Danh sach cac thu muc hoac tep quan trong khong duoc bo qua
    const ds_loi: string[] = ["src/", "tests/", "package.json", "PLAN.md", "TASK.md"];

    // 3. Kiem tra tung muc khong bi loai bo
    for (const muc of ds_loi) {
      const bi_cam: boolean = ds_dong.includes(muc);
      expect(bi_cam).toBe(false);
    }
  });
});
