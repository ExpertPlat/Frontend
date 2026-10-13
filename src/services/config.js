/** Every call goes to VITE_API_BASE_URL through api/client.js (the Laravel backend). There is no in-browser mock server. */

/** Language sent as Accept-Language. The UI provider keeps it in sync with the interface language. */
let apiLanguage = 'ar';
export const setApiLanguage = (language) => { apiLanguage = language === 'en' ? 'en' : 'ar'; };
export const getApiLanguage = () => apiLanguage;
