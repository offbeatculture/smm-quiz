export const FB_PIXEL_ID = "1235272225360337";

/**
 * Standard Facebook Pixel events helper
 */
export const pageView = () => {
  if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq("track", "PageView");
  } else {
    console.warn("fbq not found, not firing PageView");
  }
};

/**
 * Track Standard Events (ViewContent, Lead, etc.)
 */
export const trackStandard = (eventName: string, data = {}) => {
  if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq("track", eventName, data);
  } else {
    console.warn(`fbq not found, not firing standard event: ${eventName}`, data);
  }
};

/**
 * Track Custom Events
 */
export const trackCustom = (eventName: string, data = {}) => {
  if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq("trackCustom", eventName, data);
  } else {
    console.warn(`fbq not found, not firing custom event: ${eventName}`, data);
  }
};
