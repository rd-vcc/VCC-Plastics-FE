import i18n from "../../../i18n";

export const translations = {
  "vi": {},
  "en": {},
  "ja": {}
};

Object.entries(translations).forEach(([language, translation]) => {
  i18n.addResourceBundle(language, "translation", translation, true, true);
});

export default translations;
