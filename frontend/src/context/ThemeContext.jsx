import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [temaClaro, setTemaClaro] = useState(() => {
    return localStorage.getItem("tema") === "claro";
  });

  useEffect(() => {
    if (temaClaro) {
      document.body.classList.add("tema-claro");
      localStorage.setItem("tema", "claro");
    } else {
      document.body.classList.remove("tema-claro");
      localStorage.setItem("tema", "oscuro");
    }
  }, [temaClaro]);

  const toggleTema = () => setTemaClaro((v) => !v);

  return (
    <ThemeContext.Provider value={{ temaClaro, toggleTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTema() {
  return useContext(ThemeContext);
}