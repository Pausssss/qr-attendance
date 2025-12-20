import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Google Login Button (Google Identity Services)
 * - Cần thêm script Google ở index.html (đã có trong project)
 * - Client ID: dùng VITE_GOOGLE_CLIENT_ID (fallback sang clientId cũ)
 */
export default function GoogleLoginButton({ role }) {
  const buttonRef = useRef(null);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    /* global google */
    if (!window.google || !buttonRef.current) return;

    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "642523155644-4egadtkj5hpgidmed85b65hhuqs7nogj.apps.googleusercontent.com";

    // Reset để render lại button nếu role thay đổi
    buttonRef.current.innerHTML = "";

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          // response.credential chính là Google ID Token
          const user = await loginWithGoogle(response.credential, role);

          if (user.role === "TEACHER") navigate("/teacher");
          else navigate("/student");
        } catch (err) {
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            "Google login failed";
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
