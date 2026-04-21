export default function handler(req, res) {
  const rsvpApiUrl = String(process.env.RSVP_API_URL || "").trim();
  const invitationBaseUrl = String(process.env.INVITATION_BASE_URL || "").trim();
  const publicConfigMode = String(process.env.PUBLIC_CONFIG_MODE || "").trim();

  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.status(200).json({
    success: true,
    rsvpApiUrl,
    invitationBaseUrl,
    publicConfigMode
  });
}
