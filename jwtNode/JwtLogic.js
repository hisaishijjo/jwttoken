import Jtw from "./Jwt-util.js";
import redisClient from "./Redis.js";
import express from "express";
import jsonwebtoken from "jsonwebtoken";

export default () => {
  const router = express.Router();
  router.post("/login", async (req, res) => {
    const success = false;
    const user = req.body;

    if (user.id === "hello" && user.pw === "world") {
      // id, pw가 맞다면..
      // access token과 refresh token을 발급합니다.
      const accessToken = Jtw.sign(user);
      const refreshToken = Jtw.refresh();

      // 발급한 refresh token을 redis에 key를 user의 id로 하여 저장합니다.
      redisClient.set(user.id, refreshToken);

      res.status(200).send({
        // client에게 토큰 모두를 반환합니다.
        ok: true,
        data: {
          accessToken,
          refreshToken,
        },
      });
    } else {
      res.status(401).send({
        ok: false,
        message: "password is incorrect",
      });
    }
  });

  router.get("/check", (req, res, next) => {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split("Bearer ")[1]; // header에서 access token을 가져옵니다.
      const result = Jtw.verify(token); // token을 검증합니다.
      if (result.ok) {
        // token이 검증되었으면 req에 값을 세팅하고, 다음 콜백함수로 갑니다.
        req.id = result.id;
        req.role = result.role;
        next();
      } else {
        // 검증에 실패하거나 토큰이 만료되었다면 클라이언트에게 메세지를 담아서 응답합니다.
        res.status(401).send({
          ok: false,
          message: result.message, // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
        });
      }
    } else {
      res.status(401).send({
        ok: false,
        message: "password is incorrect",
      });
    }
  });
  router.get("/refresh", async (req, res) => {
    // access token과 refresh token의 존재 유무를 체크합니다.
    if (req.headers.authorization && req.headers.refresh) {
      const authToken = req.headers.authorization.split("Bearer ")[1];
      const refreshToken = req.headers.refresh;

      // access token 검증 -> expired여야 함.
      const authResult = Jtw.verify(authToken);

      // access token 디코딩하여 user의 정보를 가져옵니다.
      const decoded = jsonwebtoken.decode(authToken);

      // 디코딩 결과가 없으면 권한이 없음을 응답.
      if (decoded === null) {
        res.status(401).send({
          ok: false,
          message: "No authorized!",
        });
      }

      /* access token의 decoding 된 값에서
            유저의 id를 가져와 refresh token을 검증합니다. */
      const refreshResult = Jtw.refreshVerify(refreshToken, decoded.id);

      // 재발급을 위해서는 access token이 만료되어 있어야합니다.
      if (authResult.ok === false && authResult.message === "jwt expired") {
        // 1. access token이 만료되고, refresh token도 만료 된 경우 => 새로 로그인해야합니다.
        if (refreshResult.ok === false) {
          res.status(401).send({
            ok: false,
            message: "No authorized!",
          });
        } else {
          // 2. access token이 만료되고, refresh token은 만료되지 않은 경우 => 새로운 access token을 발급
          const newAccessToken = sign(user);

          res.status(200).send({
            // 새로 발급한 access token과 원래 있던 refresh token 모두 클라이언트에게 반환합니다.
            ok: true,
            data: {
              accessToken: newAccessToken,
              refreshToken,
            },
          });
        }
      } else {
        // 3. access token이 만료되지 않은경우 => refresh 할 필요가 없습니다.
        res.status(400).send({
          ok: false,
          message: "Access token is not expired!",
        });
      }
    } else {
      // access token 또는 refresh token이 헤더에 없는 경우
      res.status(400).send({
        ok: false,
        message: "Access token and refresh token are need for refresh!",
      });
    }
  });
  return router;
};
