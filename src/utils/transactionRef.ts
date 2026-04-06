import crypto from "crypto";

export function generateTransactionRef(prefix = "EC") {
  const rand = crypto.randomBytes(6).toString("hex").toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${timestamp}-${rand}`;
}

