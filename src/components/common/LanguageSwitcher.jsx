import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import { FormControl, MenuItem, Select, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../context/LanguageContext";

export default function LanguageSwitcher({ compact = false }) {
  const { t, i18n } = useTranslation();
  const { changeTemporaryLanguage, supportedLanguages } = useLanguage();
  const currentLanguage = i18n.resolvedLanguage || i18n.language || "vi";

  return (
    <Tooltip title={t("common.language")}>
      <FormControl size="small" sx={{ minWidth: compact ? 82 : 116 }}>
        <Select
          value={currentLanguage}
          onChange={(event) => changeTemporaryLanguage(event.target.value)}
          aria-label={t("common.language")}
          startAdornment={
            <LanguageOutlinedIcon sx={{ mr: 0.5, fontSize: 18 }} />
          }
          sx={{
            height: 36,
            borderRadius: "8px",
            fontSize: 13,
            color: "inherit",
            "& .MuiSelect-select": { py: 0.75, pl: 0.25 },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(148,163,184,.35)",
            },
          }}
        >
          {supportedLanguages.map((language) => (
            <MenuItem key={language} value={language}>
              {compact ? language.toUpperCase() : t(`languages.${language}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Tooltip>
  );
}
