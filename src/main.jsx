import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.jsx";
import { AppWrapper } from "./components/common/PageMeta.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./i18n";
import { installApiIdentity } from "./auth/apiIdentity";
import { installUiScale } from "./utils/uiScale";
import UiScaleStyles from "./utils/uiScaleEmotion.jsx";

installApiIdentity();
installUiScale();
import { LanguageProvider } from "./context/LanguageContext.jsx";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <UiScaleStyles>
    <LanguageProvider>
      <ThemeProvider>
        <AppWrapper>
          <App />
        </AppWrapper>
      </ThemeProvider>
    </LanguageProvider>
    </UiScaleStyles>
  </StrictMode>,
);
