import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ProtectedRoute({ children }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("/api/check-auth", { withCredentials: true })
      .then((res) => {
        setAuthenticated(res.data.authenticated);
        setAuthChecked(true);
      })
      .catch(() => {
        setAuthenticated(false);
        setAuthChecked(true);
      });
  }, []);

  useEffect(() => {
    if (authChecked && !authenticated) {
      navigate("/admin"); // redirect only after auth check is done
    }
  }, [authChecked, authenticated, navigate]);

  if (!authChecked) return <p>Loading...</p>;

  return authenticated ? children : null;
}
