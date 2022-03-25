import { Request, Response } from 'express';
import { logger } from '../../../logger';
import { accountCreate, accountDelete, emailChange, emailChangeDeque, emailChangeEnqueue, passwordChange, passwordReset, passwordResetDeque, passwordResetEnqueue, signupDeque, signupEnqueue, usernameChange } from "../../../models/services/accountCommandService";
import { v4 as uuidv4 } from 'uuid';
import { BASE_URL, BASE_URL_FRONT } from '../../..';
import { accountDb } from '../../../dao';
import { sessionService } from '../../../models/services/sessionService';
import { validationResult, matchedData } from 'express-validator';
import { sendMail } from '../../../models/services/sendMailService';

/**
* ユーザ名変更
* 
* @param req expressのリクエストオブジェクト
* @param req expressのレスポンスオブジェクト
*/
export function postUsernameChange(req: Request, res: Response) {
    usernameChange({ targetId: (req.session as any).account._id, username: req.body.username }).then(function() {
        res.status(200).json({ result: "ok" }).send();
    }).catch(function(reason) {
        logger.error(reason);
        res.status(500).json({ result: "ng" }).send();
    });
}

/**
* パスワード変更
* 
* @param req expressのリクエストオブジェクト
* @param req expressのレスポンスオブジェクト
*/
export function postPasswordChange(req: Request, res: Response) {
    passwordChange({ targetId: (req.session as any).account._id, currentPassword: req.body.currentPassword, newPassword: req.body.newPassword }).then(function() {
        res.status(200).json({ result: "ok" }).send();
    }).catch(function(reason) {
        logger.error(reason);
        res.status(500).json({ result: "ng" }).send();
    });
}

/**
* サインアップ（ユーザ作成）開始
* 指定されたメールアドレスに正式登録用のリンクを含んだメールを送信する
* 誰によるサインアップか識別するためにリンクにはトークンを付与する
* 
* @param req expressのリクエストオブジェクト
* @param req expressのレスポンスオブジェクト
*/
export async function postSignup(req: Request, res: Response) {
    logger.info({ email: req.body.email, username: req.body.username });

    // バリデーション
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn(errors);
        res.status(400).json({ errors: errors.array() }).send();
        return;
    }

    const token = uuidv4();
    const html = 'この度はSTJJ.AICのアカウント作成ありがとうございます。<br>正式にアカウント作成を終了するには、次のリンクを押してパスワードを登録していただく必要があります。<br><a href="' + BASE_URL_FRONT + '/#/signup-password?token=' + token + '">STJJ.AIC パスワード登録リンク</a><br>※本メールに心当たりのない場合はお手数ですが本メールの破棄をお願いします。';

    signupEnqueue({ email: req.body.email, username: req.body.username, id: token });

    sendMail(req.body.email, 'STJJ.AIC アカウント作成手続き', html).then((sendMailResult) => {
        if (sendMailResult.state == "ok") {
            res.status(200).json({ result: "ok" }).send();
            return;
        }
        logger.error(sendMailResult);
        res.status(500).json({ result: "ng" }).send();
    }).catch((reason) => {
        logger.error(reason);
        res.status(500).json({ result: "ng" }).send();
    });

}

/**
* サインアップ（ユーザ作成）終了
* @param req expressのリクエストオブジェクト
* @param req expressのレスポンスオブジェクト
*/
export function postSignupPassword(req: Request, res: Response) {

    // バリデーション
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn(errors);
        res.status(400).json({ errors: errors.array() }).send();
        return;
    }

    const reserved = signupDeque(req.body.token);
    if (reserved) {
        // 正式にDB登録
        accountCreate(reserved.username, reserved.email, req.body.password)
        .then(account => {
            (req.session as any).account = account; // 登録OKなのでセッションに格納
            sessionService.addSession(req.session);
            res.status(200).json({ result: "ok" }).send();
        }).catch(() => {
            res.status(500).json({ result: "ng" }).send();
        });
    } else {
        logger.error("トークンのマッチングに失敗");
        res.status(500).json({ result: "ng" }).send();
    }

}

export function postAccountDelete(req: Request, res: Response) {

    accountDelete((req.session as any).account._id, req.body.password).then(() => {
        req.session.destroy(() => {
            res.status(200).json({ result: "ok" }).send();
        });
    }).catch(() => {
        res.status(500).json({ result: "ng" }).send();
    });

}


export function postPasswordReset(req: Request, res: Response) {

    const token = uuidv4();
    const html = 'STJJ.AICのパスワード再登録が申請されました。<br>正式にパスワード再登録するには、次のリンクを押して新しいパスワードを登録していただく必要があります。<br><a href="' + BASE_URL_FRONT + '/#/password-reset-new?token=' + token + '">STJJ.AIC パスワード再登録</a><br>※本メールに心当たりのない場合はお手数ですが本メールの破棄をお願いします。';

    passwordResetEnqueue({ email: req.body.email, id: token });

    sendMail(req.body.email, 'STJJ.AIC パスワード再登録手続き', html).then((sendMailResult) => {
        if (sendMailResult.state == "ok") {
            res.status(200).json({ result: "ok" }).send();
            return;
        }
        logger.error(sendMailResult);
        res.status(500).json({ result: "ng" }).send();
    }).catch((reason) => {
        logger.error(reason);
        res.status(500).json({ result: "ng" }).send();
    });

}

export function postPasswordResetNew(req: Request, res: Response) {
    const reserved = passwordResetDeque(req.body.token);
    if (reserved) {
        // 正式にDB登録
        passwordReset(reserved.email, req.body.password)
        .then(account => {
            res.status(200).json({ result: "ok" }).send();
        }).catch(() => {
            res.status(500).json({ result: "ng" }).send();
        });
    } else {
        logger.error("トークンのマッチングに失敗");
        res.status(500).json({ result: "ng" }).send();
    }
}


export function postEmailChange(req: Request, res: Response) {

    const token = uuidv4();
    const html = 'STJJ.AICのメールアドレス変更が申請されました。<br>正式にメールアドレス変更するには、次のリンクを押して新しいパスワードを登録していただく必要があります。<br><a href="' + BASE_URL_FRONT + '/#/email-change-new?token=' + token + '">STJJ.AIC メールアドレス変更</a><br>※本メールに心当たりのない場合はお手数ですが本メールの破棄をお願いします。';

    emailChangeEnqueue({ currentEmail: (req.session as any).account.email, newEmail: req.body.email, id: token });

    sendMail(req.body.email, 'STJJ.AIC メールアドレス変更手続き', html).then((sendMailResult) => {
        if (sendMailResult.state == "ok") {
            res.status(200).json({ result: "ok" }).send();
            return;
        }
        logger.error(sendMailResult);
        res.status(500).json({ result: "ng" }).send();
    }).catch((reason) => {
        logger.error(reason);
        res.status(500).json({ result: "ng" }).send();
    });
}

export function postEmailChangeNew(req: Request, res: Response) {
    const reserved = emailChangeDeque(req.body.token);
    if (reserved) {
        // 正式にDB登録
        emailChange(reserved.currentEmail, reserved.newEmail)
        .then(() => {
            (req.session as any).account.email = reserved.newEmail;
            res.status(200).json({ result: "ok" }).send();
        }).catch(() => {
            res.status(500).json({ result: "ng" }).send();
        });
    } else {
        logger.error("トークンのマッチングに失敗");
        res.status(500).json({ result: "ng" }).send();
    }
}
