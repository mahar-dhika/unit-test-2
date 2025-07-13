/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/app/login/page";

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  toast: {
    loading: jest.fn(() => "loading-toast-id"),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe("LoginPage", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    jest.clearAllMocks();
  });

  it("should render the login form", () => {
    render(<LoginPage />);
    
    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("should show validation error when email is empty", async () => {
    render(<LoginPage />);
    
    const submitButton = screen.getByRole("button", { name: /login/i });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });

  it("should show validation error when password is too short", async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });
    
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "123" } });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText(/password must be at least 6 characters/i)).toBeInTheDocument();
  });

  it("should show validation errors for both empty email and short password", async () => {
    render(<LoginPage />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });
    
    fireEvent.change(passwordInput, { target: { value: "123" } });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
  });

  it("should toggle password visibility", () => {
    render(<LoginPage />);
    
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const toggleButton = screen.getByRole("button", { name: /show password/i });
    
    expect(passwordInput.type).toBe("password");
    
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe("text");
    
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe("password");
  });

  it("should call login API with correct data on valid form submission", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: "Login successful!" }),
    });

    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });
    
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });
    });
  });

  it("should handle successful login response", async () => {
    const { toast } = require("react-hot-toast");
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: "Login successful!" }),
    });

    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });
    
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Login successful!", { id: "loading-toast-id" });
    });
  });

  it("should handle login error response", async () => {
    const { toast } = require("react-hot-toast");
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: "Invalid credentials." }),
    });

    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });
    
    fireEvent.change(emailInput, { target: { value: "wrong@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid credentials.", { id: "loading-toast-id" });
    });
  });

  it("should handle API error without message", async () => {
    const { toast } = require("react-hot-toast");
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    });

    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });
    
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("An error occurred.", { id: "loading-toast-id" });
    });
  });

  it("should not submit form when validation fails", async () => {
    render(<LoginPage />);
    
    const submitButton = screen.getByRole("button", { name: /login/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
    
    expect(fetch).not.toHaveBeenCalled();
  });
});
