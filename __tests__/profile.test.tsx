/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfilePage from "@/app/profile/page";

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  toast: {
    loading: jest.fn(() => "loading-toast-id"),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true }),
    ok: true,
    status: 200,
  })
) as jest.Mock;

describe("ProfilePage", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    jest.clearAllMocks();
  });

  it("renders all form fields", () => {
    render(<ProfilePage />);
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Birth Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Bio/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Update/i })).toBeInTheDocument();
  });

  it("renders the page title", () => {
    render(<ProfilePage />);
    expect(screen.getByRole("heading", { name: /Update Profile/i })).toBeInTheDocument();
  });

  it("shows validation errors for empty/invalid fields", async () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    expect(
      await screen.findByText(/Username must be at least 6 characters/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Full name is required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Must be a valid email format/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Phone must be 10-15 digits/i)).toBeInTheDocument();
  });

  it("shows validation error for short username", async () => {
    render(<ProfilePage />);
    
    // Fill in other required fields to isolate username validation
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "Valid User" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "valid@email.com" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "1234567890" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    expect(
      await screen.findByText(/Username must be at least 6 characters/i)
    ).toBeInTheDocument();
  });

  it("shows validation error for invalid email", async () => {
    render(<ProfilePage />);
    
    // Only set the email to invalid, leave others empty so we get multiple errors including email
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "invalid-email" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    // Debug: Log all text on the page
    await waitFor(() => {
      const errors = screen.getAllByText(/must/i);
      console.log('Found error messages:', errors.map(el => el.textContent));
      expect(screen.getByText(/Must be a valid email format/i)).toBeInTheDocument();
    });
  });

  it("shows validation error for invalid phone", async () => {
    render(<ProfilePage />);
    
    // Fill in other required fields to isolate phone validation
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "validuser" },
    });
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "Valid User" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "valid@email.com" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    expect(
      await screen.findByText(/Phone must be 10-15 digits/i)
    ).toBeInTheDocument();
  });

  it("shows validation error for future birth date", async () => {
    render(<ProfilePage />);
    
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    
    // Fill in other required fields to isolate birth date validation
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "validuser" },
    });
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "Valid User" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "valid@email.com" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "1234567890" },
    });
    fireEvent.change(screen.getByLabelText(/Birth Date/i), {
      target: { value: futureDate.toISOString().split('T')[0] },
    });
    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    expect(
      await screen.findByText(/Birth date cannot be in the future/i)
    ).toBeInTheDocument();
  });

  it("shows validation error for bio that is too long", async () => {
    render(<ProfilePage />);
    
    const longBio = "a".repeat(161);
    
    // Fill in other required fields to isolate bio validation
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "validuser" },
    });
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "Valid User" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "valid@email.com" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "1234567890" },
    });
    fireEvent.change(screen.getByLabelText(/Bio/i), {
      target: { value: longBio },
    });
    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    expect(
      await screen.findByText(/Bio must be 160 characters or less/i)
    ).toBeInTheDocument();
  });

  it("submits valid form and shows success message", async () => {
    const { toast } = require("react-hot-toast");
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });

    render(<ProfilePage />);
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "validuser" },
    });
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "1234567890" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/profile",
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Profile updated successfully!", { id: "loading-toast-id" });
    });
  });

  it("handles API error response", async () => {
    const { toast } = require("react-hot-toast");
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Validation failed" }),
    });

    render(<ProfilePage />);
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "validuser" },
    });
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "1234567890" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Validation failed", { id: "loading-toast-id" });
    });
  });

  it("handles API error without message", async () => {
    const { toast } = require("react-hot-toast");
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    render(<ProfilePage />);
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "validuser" },
    });
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "1234567890" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("An error occurred.", { id: "loading-toast-id" });
    });
  });

  it("does not submit form when validation fails", async () => {
    render(<ProfilePage />);
    
    fireEvent.click(screen.getByRole("button", { name: /Update/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Username must be at least 6 characters/i)).toBeInTheDocument();
    });
    
    expect(fetch).not.toHaveBeenCalled();
  });

  it("submits form with all fields including optional ones", async () => {
    render(<ProfilePage />);
    
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "validuser" },
    });
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "1234567890" },
    });
    fireEvent.change(screen.getByLabelText(/Birth Date/i), {
      target: { value: "1990-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/Bio/i), {
      target: { value: "This is my bio" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/profile",
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "validuser",
            fullName: "John Doe",
            email: "john@example.com",
            phone: "1234567890",
            birthDate: "1990-01-01",
            bio: "This is my bio",
          }),
        })
      );
    });
  });

  it("allows valid bio with exactly 160 characters", async () => {
    render(<ProfilePage />);
    
    const validBio = "a".repeat(160);
    
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "validuser" },
    });
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "1234567890" },
    });
    fireEvent.change(screen.getByLabelText(/Bio/i), {
      target: { value: validBio },
    });

    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    // Should not show bio validation error
    expect(screen.queryByText(/Bio must be 160 characters or less/i)).not.toBeInTheDocument();
  });
});
