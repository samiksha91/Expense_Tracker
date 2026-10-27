export function notFound(req, res) {
  return res.status(404).json({ error: "Not found" });
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({ error: "Internal server error" });
}
