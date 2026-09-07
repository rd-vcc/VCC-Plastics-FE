import { useEffect, useState } from "react";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Alert, Box, Button, Card, CardContent, CircularProgress, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { API_ENDPOINTS } from "../../config/config";
import { useLanguage } from "../../context/LanguageContext";
import { getAccessToken } from "../../auth/auth";
import { isSupportedLanguage } from "../../i18n";

export default function SystemSettings() {
  const { t } = useTranslation();
  const { defaultLanguage, setDefaultLanguage, supportedLanguages } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    const token = getAccessToken();
    fetch(API_ENDPOINTS.SYSTEM_LANGUAGE, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || t("systemSettings.loadError"));
        return data;
      })
      .then((data) => {
        if (!active) return;
        const language = isSupportedLanguage(data.default_language) ? data.default_language : "vi";
        setSelectedLanguage(language);
        setDefaultLanguage(language);
      })
      .catch((requestError) => { if (active) setError(requestError.message || t("systemSettings.loadError")); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [setDefaultLanguage, t]);

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setIsSaving(true);
    try {
      const token = getAccessToken();
      const response = await fetch(API_ENDPOINTS.SYSTEM_LANGUAGE, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ default_language: selectedLanguage }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || t("systemSettings.saveError"));
      setDefaultLanguage(data.default_language || selectedLanguage);
      setSuccess(t("systemSettings.saved"));
    } catch (requestError) {
      setError(requestError.message || t("systemSettings.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (<div>
    <PageMeta title={`${t("systemSettings.title")} | VCC Plastics`} description={t("systemSettings.languageDescription")} />
    <PageBreadcrumb pageTitle="System Settings" />
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={3} maxWidth={680}>
          <Box display="flex" gap={1.5} alignItems="flex-start">
            <LanguageOutlinedIcon sx={{ color: "#005BAB", mt: 0.25 }} />
            <Box>
              <Typography variant="h6" fontWeight={700}>{t("systemSettings.languageTitle")}</Typography>
              <Typography variant="body2" color="text.secondary">{t("systemSettings.languageDescription")}</Typography>
            </Box>
          </Box>
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess("")}>{success}</Alert>}
          {isLoading ? (<Stack direction="row" spacing={1.5} alignItems="center"><CircularProgress size={20} /><Typography variant="body2">{t("common.loading")}</Typography></Stack>) : (
            <Stack spacing={2}>
              <Typography variant="body2">{t("systemSettings.currentDefault")}: <strong>{t(`languages.${defaultLanguage}`)}</strong></Typography>
              <FormControl size="small" fullWidth>
                <InputLabel id="default-language-label">{t("systemSettings.selectLabel")}</InputLabel>
                <Select labelId="default-language-label" value={selectedLanguage} label={t("systemSettings.selectLabel")} onChange={(event) => setSelectedLanguage(event.target.value)}>
                  {supportedLanguages.map((language) => <MenuItem key={language} value={language}>{t(`languages.${language}`)}</MenuItem>)}
                </Select>
              </FormControl>
              <Alert severity="info">{t("systemSettings.temporaryNote")}</Alert>
              <Box>
                <Button variant="contained" startIcon={isSaving ? <CircularProgress color="inherit" size={16} /> : <SaveOutlinedIcon />} disabled={isSaving || selectedLanguage === defaultLanguage} onClick={handleSave} sx={{ bgcolor: "#005BAB", "&:hover": { bgcolor: "#F58220" } }}>
                  {isSaving ? t("common.saving") : t("systemSettings.save")}
                </Button>
              </Box>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  </div>);
}

