// File: qr-attendance-frontend/src/components/GoogleLoginButton.jsx
import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GoogleLoginButton({ role }) {
  const buttonRef = useRef(null);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    /* global google */
    if (!window.google || !buttonRef.current) return;

    const clientId =
      "642523155644-4egadtkj5hpgidmed85b65hhuqs7nogj.apps.googleusercontent.com";

    console.log("Google client_id (frontend):", clientId, "role:", role);

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          console.log("Google credential (first 20 chars):", response.credential.slice(0, 20));
          const user = await loginWithGoogle(response.credential, role);
          console.log("Google login success, user:", user);

          if (user.role === "TEACHER") navigate("/teacher");
          else navigate("/student");
        } catch (err) {
          console.error("Google login failed:", err);
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            "Đăng nhập Google thất bại";
          alert(msg);
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      width: 320,
    });
  }, [role, loginWithGoogle, navigate]);

  return <div ref={buttonRef} style={{ marginBottom: "1rem" }} />;
}
