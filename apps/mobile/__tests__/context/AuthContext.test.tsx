import React from "react";
import { render, act, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { AuthProvider, useAuth } from "../../context/AuthContext";

// Get the mocked supabase
const { supabase } = require("../../libs/supabaseClient");

// We also need to mock expo-web-browser and expo-linking (already done in jest.setup.ts)
const WebBrowser = require("expo-web-browser");
const Linking = require("expo-linking");

function TestConsumer() {
  const { session, user, loading, signInWithGoogle, signOut } = useAuth();
  return (
    <>
      <Text testID="loading">{String(loading)}</Text>
      <Text testID="session">{session ? "has-session" : "no-session"}</Text>
      <Text testID="user">{user ? user.id : "no-user"}</Text>
      <Text testID="signIn" onPress={signInWithGoogle}>Sign In</Text>
      <Text testID="signOut" onPress={signOut}>Sign Out</Text>
    </>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no session
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  it("throws when useAuth is called outside provider", () => {
    // Suppress console.error for this test
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      render(<TestConsumer />);
    }).toThrow("useAuth must be inside AuthProvider");
    spy.mockRestore();
  });

  it("renders children", () => {
    const { getByText } = render(
      <AuthProvider>
        <Text>Child</Text>
      </AuthProvider>
    );
    expect(getByText("Child")).toBeTruthy();
  });

  it("starts in loading state", () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    // Initially loading is true (before getSession resolves)
    expect(getByTestId("loading")).toBeTruthy();
  });

  it("resolves session from getSession", async () => {
    const mockSession = {
      access_token: "test-token",
      user: { id: "user-123", email: "test@test.com" },
    };
    supabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId("loading").props.children).toBe("false");
    });
    expect(getByTestId("session").props.children).toBe("has-session");
    expect(getByTestId("user").props.children).toBe("user-123");
  });

  it("sets session to null when getSession returns no session", async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId("loading").props.children).toBe("false");
    });
    expect(getByTestId("session").props.children).toBe("no-session");
    expect(getByTestId("user").props.children).toBe("no-user");
  });

  it("subscribes to auth state changes", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
  });

  it("unsubscribes on unmount", () => {
    const unsubscribe = jest.fn();
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });

    const { unmount } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it("calls signOut on supabase", async () => {
    supabase.auth.signOut.mockResolvedValue({ error: null });

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId("loading").props.children).toBe("false");
    });

    await act(async () => {
      getByTestId("signOut").props.onPress();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it("signInWithGoogle calls signInWithOAuth", async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({
      data: { url: "https://accounts.google.com/o/oauth2" },
      error: null,
    });
    WebBrowser.openAuthSessionAsync.mockResolvedValue({ type: "cancel" });

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId("loading").props.children).toBe("false");
    });

    await act(async () => {
      getByTestId("signIn").props.onPress();
    });

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google",
      })
    );
  });

  it("signInWithGoogle handles OAuth error gracefully", async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({
      data: null,
      error: { message: "OAuth error" },
    });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId("loading").props.children).toBe("false");
    });

    await act(async () => {
      getByTestId("signIn").props.onPress();
    });

    // Should not throw
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("signInWithGoogle processes successful auth callback", async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({
      data: { url: "https://accounts.google.com/o/oauth2" },
      error: null,
    });
    WebBrowser.openAuthSessionAsync.mockResolvedValue({
      type: "success",
      url: "planticia://#access_token=test-access&refresh_token=test-refresh",
    });
    supabase.auth.setSession.mockResolvedValue({
      data: { session: { access_token: "test-access" } },
      error: null,
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId("loading").props.children).toBe("false");
    });

    await act(async () => {
      getByTestId("signIn").props.onPress();
    });

    expect(supabase.auth.setSession).toHaveBeenCalledWith({
      access_token: "test-access",
      refresh_token: "test-refresh",
    });
  });

  it("signInWithGoogle handles missing tokens", async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({
      data: { url: "https://accounts.google.com/o/oauth2" },
      error: null,
    });
    WebBrowser.openAuthSessionAsync.mockResolvedValue({
      type: "success",
      url: "planticia://#no_tokens_here=true",
    });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId("loading").props.children).toBe("false");
    });

    await act(async () => {
      getByTestId("signIn").props.onPress();
    });

    expect(supabase.auth.setSession).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
