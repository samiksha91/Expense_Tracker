export function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const fields = {};
      for (const issue of result.error.issues) {
        const key = issue.path.length ? issue.path.join(".") : "body";
        if (!fields[key]) fields[key] = issue.message;
      }
      return res.status(400).json({ error: "Validation failed", fields });
    }

    req.validated = result.data;
    return next();
  };
}
