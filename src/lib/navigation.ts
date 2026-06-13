const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export const marketingHomeHref = baseUrl || "/";
export const marketingAboutHref = baseUrl ? `${baseUrl}/about` : "/about";
export const marketingBlogHref = baseUrl ? `${baseUrl}/blog` : "/blog";
export const marketingPrivacyHref = baseUrl ? `${baseUrl}/privacy` : "/privacy";
export const marketingTermsHref = baseUrl ? `${baseUrl}/terms` : "/terms";
export const marketingHowItWorksHref = baseUrl ? `${baseUrl}/#how-it-works` : "/#how-it-works";
export const marketingPricingHref = baseUrl ? `${baseUrl}/#pricing` : "/#pricing";

export const appAccountPath = "/account";

export function getAppAuthHref(redirectPath = appAccountPath) {
    const encodedRedirect = encodeURIComponent(redirectPath);
    return appUrl ? `${appUrl}/auth?redirect=${encodedRedirect}` : `/auth?redirect=${encodedRedirect}`;
}

export const appAuthHref = getAppAuthHref();
export const appUploadEntryHref = getAppAuthHref("/app/upload");
export const appAccountHref = appUrl ? `${appUrl}${appAccountPath}` : appAccountPath;
export const appAccountBillingHref = appUrl ? `${appUrl}/account/billing` : "/account/billing";
export const appUploadHref = appUrl ? `${appUrl}/app/upload` : "/app/upload";

export function getAccountReportHref(analysisId: string) {
    return appUrl ? `${appUrl}/account/reports/${analysisId}` : `/account/reports/${analysisId}`;
}
