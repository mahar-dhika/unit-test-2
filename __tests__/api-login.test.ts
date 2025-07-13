/**
 * @jest-environment node
 */
import { POST } from "@/app/api/login/route";
import { NextRequest } from "next/server";

describe("POST /api/login", () => {
  it("should return 400 if email is missing", async () => {
    const req = {
      json: () => Promise.resolve({ password: "password123" }),
    } as Request;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Email and password are required.");
  });

  it("should return 400 if password is missing", async () => {
    const req = {
      json: () => Promise.resolve({ email: "test@example.com" }),
    } as Request;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Email and password are required.");
  });

  it("should return 400 if both email and password are missing", async () => {
    const req = {
      json: () => Promise.resolve({}),
    } as Request;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Email and password are required.");
  });

  it("should return 400 if password is less than 6 characters", async () => {
    const req = {
      json: () => Promise.resolve({ email: "test@example.com", password: "123" }),
    } as Request;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Password must be at least 6 characters.");
  });

  it("should return 401 for invalid credentials", async () => {
    const req = {
      json: () => Promise.resolve({ email: "wrong@example.com", password: "wrongpassword" }),
    } as Request;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe("Invalid credentials.");
  });

  it("should return 200 for valid credentials", async () => {
    const req = {
      json: () => Promise.resolve({ email: "test@example.com", password: "password123" }),
    } as Request;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Login successful!");
  });
});
