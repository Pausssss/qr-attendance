import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GoogleLoginButton({ role }) {
  const buttonRef = useRef(null);
  const containerRef = useRef(null);
  const [btnWidth, setBtnWidth] = useState(320);
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();

  // Make Google button responsive to container width (fix layout on login page)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      // fallback
      setBtnWidth(320);
      return;
    }

    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
    const update = () => {
      const w = el.clientWidth || 320;
      setBtnWidth(clamp(Math.floor(w), 240, 420));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!window.google || !buttonRef.current) return;

    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "642523155644-4egadtkj5hpgidmed85b65hhuqs7nogj.apps.googleusercontent.com";

    buttonRef.current.innerHTML = "";

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          const user = await loginWithGoogle(response.credential, role);

          if (user.role === "TEACHER") navigate("/teacher");
          else navigate("/student");
        } catch (err) {
          console.error(err);
          alert(
            err?.response?.data?.message ||
              "Google login failed"
          );
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      width: btnWidth,
    });
  }, [role, btnWidth, navigate, loginWithGoogle]);

  return (
    <div ref={containerRef} className="google-btn-wrap">
      <div ref={buttonRef} />
    </div>
  );
}
