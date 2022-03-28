import { sessionService } from './../../../models/services/sessionService';
import { Request, Response } from 'express';
import { count, find, findAll } from '../../../models/services/cardQueryService';
import { logger } from '../../../logger';
import { login } from '../../../models/services/authenticationService';
import { LoginInfo } from '../../../models/loginInfo';
import { findOneAccount } from '../../../models/services/accountQueryService';
import { MESSAGE_BANNED_USER, MESSAGE_LOGIN_FAILED } from '../../../constants';

// ログインコントローラ（POST）
export function postLogin(req: Request, res: Response) {
    logger.info("postLogin called");
    logger.info(req.body);

    login(new LoginInfo(req.body.usernameOrEmail, req.body.password))
    .then(account => {
        if (account.banned) {
            logger.info("ログイン失敗（BAN）");
            res.status(401).json({ result: "ng", errors: [MESSAGE_BANNED_USER] });
            return;
        }
        logger.info("ログイン成功");
        console.log(req.session.id);
        (req.session as any).account = account;
        sessionService.addSession(req.session);
        res.status(200).json({ result: "ok", account: account }).send();
    }).catch(() => { 
        logger.info("ログイン失敗");
        res.status(401).json({ result: "ng", errors: [MESSAGE_LOGIN_FAILED] }).send();
    });
}

export function postSession(req: Request, res: Response) {
    console.log("セッションチェック");
    console.log(req.session.id);
    if ((req.session as any).account) {
        findOneAccount((req.session as any).account._id)
        .then(account => {
            res.status(200).json({ alive: true, account: account }).send();
        }).catch(() => {
            res.status(200).json({ alive: false }).send();
        });
    } else {
        res.status(200).json({ alive: false }).send();
    }
}

export function postLogout(req: Request, res: Response) {
    logger.info("postLogout called");
    req.session.destroy((err) => {
        res.status(200).json({ result: "ok" }).send();
    });
}

function escapeRegex(targetString: string) {
    return targetString.replace(/[.*+?^=!:${}()|[\]\/\\]/g, '\\$&');
}
