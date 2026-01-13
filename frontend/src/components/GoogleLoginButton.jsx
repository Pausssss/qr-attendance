import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GoogleLoginButton({ role }) {
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();

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
      width: 320,
    });
  }, [role, navigate, loginWithGoogle]);

  return <div ref={buttonRef} style={{ marginBottom: "1rem" }} />;
}
