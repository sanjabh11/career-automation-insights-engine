
export const SecurityHeaders = () => {
  // Note: CSP and X-Frame-Options should be set via HTTP headers at the server level
  // Meta tags for these directives are ignored by browsers
  // This component is kept for backward compatibility but doesn't set ineffective headers
  return null;
}

export default SecurityHeaders;
