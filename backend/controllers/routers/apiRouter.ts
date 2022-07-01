import express from "express";
import { cabinetList } from "../../models/types";
import {
  createLentLog,
  createLent,
  getLentUser,
  getUser,
  activateExtension,
} from "../../models/queryModel";
import { loginBanCheck } from "../middleware/authMiddleware";
import { verifyToken } from "../middleware/jwtMiddleware";

export const apiRouter = express.Router();

// 전체 사물함에 대한 정보
apiRouter.post("/cabinet", (req: any, res: any) => {
  if (!cabinetList) {
    res.status(400).send({ error: "no cabinet information" });
  } else {
    res.send(cabinetList);
  }
});

// 현재 모든 대여자들의 정보
apiRouter.post("/lent_info", loginBanCheck, async (req: any, res: any) => {
  try {
    getLentUser().then((resp: any) => {
      const isLent = resp.lentInfo.findIndex(
        (cabinet: any) =>
          cabinet.lent_user_id == req.session.passport.user.user_id
      );
      res.send({ lentInfo: resp.lentInfo, isLent: isLent });
    });
  } catch (err: any) {
    console.log(err);
    res.status(400);
    throw err;
  }
});

// 특정 사물함을 빌릴 때 요청
apiRouter.post("/lent", loginBanCheck, async (req: any, res: any) => {
  let errno: number;
  try {
    const user = await verifyToken(req, res);
    if (user !== undefined) {
      await getUser(user).then(async (resp: any) => {
        if (resp.lent_id === -1) {
          await createLent(req.body.cabinet_id, req.session.passport.user).then(
            (response: any) => {
              if (response && response.errno === -1) {
                errno = -2;
              } else {
                errno = req.body.cabinet_id;
              }
            }
          );
          res.send({ cabinet_id: errno });
        } else {
          res.send({ cabinet_id: -1 });
        }
      });
    } else {
      res.status(400).json({ error: "Permission denied" });
    }
  } catch (err) {
    console.log(err);
    res.status(400).send({ cabinet_id: req.cabinet_id });
    throw err;
  }
});

// 특정 사용자가 현재 대여하고 있는 사물함의 정보
apiRouter.post("/return_info", loginBanCheck, async (req: any, res: any) => {
  try {
    const user = await verifyToken(req, res);
    if (user !== undefined) {
      getUser(user).then((resp: any) => {
        res.send(resp);
      });
    } else {
      res.status(400).json({ error: "Permission denied" });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
    throw err;
  }
});

// 특정 사물함을 반납할 때 요청
apiRouter.post("/return", loginBanCheck, async (req: any, res: any) => {
  try {
    const user = await verifyToken(req, res);
    if (user !== undefined) {
      createLentLog({
        user_id: user.user_id,
        intra_id: user.intra_id,
      }).then((resp: any) => {
        res.sendStatus(200);
      });
    } else {
      res.status(400).json({ error: "Permission denied" });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
    throw err;
  }
});

// 적절한 유저가 페이지를 접근하는지에 대한 정보
apiRouter.post("/check", loginBanCheck, async (req: any, res: any) => {
  const user = await verifyToken(req, res);
  if (user !== undefined) {
    await res.send({ user: user });
  } else {
    res.status(400).json({ error: "Permission denied" });
  }
});

apiRouter.post("/extension", loginBanCheck, async (req: any, res: any) => {
  try {
    const user = await verifyToken(req, res);
    if (user !== undefined) {
      activateExtension(user).then((resp: any) => {
        res.sendStatus(200);
      });
    } else {
      res.status(400).json({ error: "Permission denied" });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
    throw err;
  }
});
