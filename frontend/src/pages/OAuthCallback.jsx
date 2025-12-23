import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const user = params.get("user");

    if (token) {
      localStorage.setItem("qr_token", token);
      if (user) {
        localStorage.setItem("qr_user", user);
      }
      navigate("/", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return <p>Đang đăng nhập...</p>;
}
