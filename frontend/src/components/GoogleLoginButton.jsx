import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GoogleLoginButton({ role }) {
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!window.google || !buttonRef.current || !clientId) return;

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
      width: 320,
    });
  }, [role, navigate, loginWithGoogle]);

  if (!clientId) {
    return (
      <div className="alert alert-warning mb-3">
        Thiếu cấu hình <b>VITE_GOOGLE_CLIENT_ID</b>. Hãy tạo file <code>.env.local</code> theo <code>.env.example</code>.
      </div>
    );
  }

  return <div ref={buttonRef} className="mb-3" />;
}
