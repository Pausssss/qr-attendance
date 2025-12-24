import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Renders Google Identity Services button.
 * If the Google script hasn't loaded yet, show a fallback button to reload.
 */
export default function GoogleLoginButton({ role }) {
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { loginWithGoogle, loading } = useAuth();
  const [gsiReady, setGsiReady] = useState(false);

  const clientId = useMemo(
    () =>
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      // fallback (OK for local demo, but you should set VITE_GOOGLE_CLIENT_ID in production)
      "642523155644-4egadtkj5hpgidmed85b65hhuqs7nogj.apps.googleusercontent.com",
    []
  );

  useEffect(() => {
    // Wait a bit for <script src="https://accounts.google.com/gsi/client"> to load
    let cancelled = false;
    const startedAt = Date.now();

    const tick = () => {
      if (cancelled) return;
      const ok = !!window.google?.accounts?.id;
      setGsiReady(ok);
      if (ok) return;
      if (Date.now() - startedAt > 4000) return; // stop polling
      setTimeout(tick, 120);
    };

    tick();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!gsiReady || !buttonRef.current) return;

    buttonRef.current.innerHTML = "";

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          const me = await loginWithGoogle(response.credential, role);
          if (me.role === "TEACHER") navigate("/teacher");
          else navigate("/student");
        } catch (err) {
          console.error(err);
          alert(err?.response?.data?.message || err?.message || "Google login failed");
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      width: 320,
    });
  }, [gsiReady, clientId, role, navigate, loginWithGoogle]);

  if (!gsiReady) {
    return (
      <div style={{ marginBottom: "1rem" }}>
        <button
          className="btn btn-secondary"
          onClick={() => window.location.reload()}
          disabled={loading}
        >
          Tải nút đăng nhập Google
        </button>
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
          Nếu bạn thấy nút này, nghĩa là script Google chưa kịp load hoặc bị chặn.
        </div>
      </div>
    );
  }

  return <div ref={buttonRef} style={{ marginBottom: "1rem" }} />;
}
