import { Request, Response, NextFunction } from "express";
import jwt, { JwtHeader, SigningKeyCallback } from "jsonwebtoken";
import jwksClient from "jwks-rsa";

/**
 * Roles
 */
export type Role =
  | "ADMIN"
  | "AUCTION_OWNER"
  | "CAPTAIN"
  | "VIEWER";

/**
 * Auth user attached to request
 */
export interface AuthUser {
  userId: string;
  role: Role;
  auctionId?: string;
  teamId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * JWKS client
 */
const jwks = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`
});

/**
 * Get public key for JWT verification
 */
function getKey(
  header: JwtHeader,
  callback: SigningKeyCallback
) {
  if (!header.kid) {
    return callback(new Error("Missing kid in token header"));
  }

  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }

    // 🔐 IMPORTANT: Guard against undefined key
    if (!key) {
      return callback(new Error("Signing key not found"));
    }

    const publicKey = key.getPublicKey();
    callback(null, publicKey);
  });
}

/**
 * Authorization middleware
 */
export function authorize(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing Authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");

    jwt.verify(
      token,
      getKey,
      { algorithms: ["RS256"] },
      (err, decoded: any) => {
        if (err || !decoded) {
          return res
            .status(401)
            .json({ message: "Invalid or expired token" });
        }

        const role = decoded["custom:role"] as Role;

        if (!role || !allowedRoles.includes(role)) {
          return res.status(403).json({ message: "Forbidden" });
        }

        req.user = {
          userId: decoded.sub,
          role,
          auctionId: decoded["custom:auctionId"],
          teamId: decoded["custom:teamId"]
        };

        next();
      }
    );
  };
}
