import express from "express";
import { cognito } from "./cognito";

const router = express.Router();

/**
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {
    console.log("LOGIN HIT");        // 👈 DEBUG LINE
  console.log("client:", process.env.COGNITO_CLIENT_ID);
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password required" });
  }

  try {
    const response = await cognito.initiateAuth({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: process.env.COGNITO_CLIENT_ID!,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    }).promise();

    const authResult = response.AuthenticationResult;

    if (!authResult) {
      return res
        .status(401)
        .json({ message: "Authentication failed" });
    }

    res.json({
      idToken: authResult.IdToken,
      accessToken: authResult.AccessToken,
      refreshToken: authResult.RefreshToken,
      expiresIn: authResult.ExpiresIn
    });
  } catch (err: any) {
    console.error("Login error:", err);

    return res.status(401).json({
      message: err.code === "NotAuthorizedException"
        ? "Invalid email or password"
        : "Login failed"
    });
  }
});

export default router;
