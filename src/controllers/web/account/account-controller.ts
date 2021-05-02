import { Request, Response } from 'express'
import { logger } from '../../../logger'
import { accountCreate, accountDelete, emailChange, emailChangeDeque, emailChangeEnqueue, passwordChange, passwordReset, passwordResetDeque, passwordResetEnqueue, signupDeque, signupEnqueue, usernameChange } from "../../../models/services/accountCommandService";
import sgMail from '@sendgrid/mail';
import { v4 as uuidv4 } from 'uuid';
import { BASE_URL, BASE_URL_FRONT } from '../../..';
import { accountDb } from '../../../dao';
import { sessionService } from '../../../models/services/sessionService';

sgMail.setApiKey('');

export function postUsernameChange(req: Request, res: Response) {
    usernameChange({ targetId: (req.session as any).account._id, username: req.body.username }).then(function() {
        res.status(200).json({ result: "ok" }).send()
    }).catch(function(reason) {
        logger.error(reason)
        res.status(500).json({ result: "ng" }).send()
    })
}

export function postPasswordChange(req: Request, res: Response) {
    passwordChange({ targetId: (req.session as any).account._id, currentPassword: req.body.currentPassword, newPassword: req.body.newPassword }).then(function() {
        res.status(200).json({ result: "ok" }).send()
    }).catch(function(reason) {
        logger.error(reason)
        res.status(500).json({ result: "ng" }).send()
    })
}

export function postSignup(req: Request, res: Response) {

    const token = uuidv4()
    const html = 'この度はSTJJ.AICのアカウント作成ありがとうございます。<br>正式にアカウント作成を終了するには、次のリンクを押してパスワードを登録していただく必要があります。<br><a href="' + BASE_URL_FRONT + '/#/signup-password?token=' + token + '">STJJ.AIC パスワード登録リンク</a><br>※本メールに心当たりのない場合はお手数ですが本メールの破棄をお願いします。'

    signupEnqueue({ email: req.body.email, username: req.body.username, id: token })

    const msg = {
        to: req.body.email,
        from: 'noreply@mail.scptcgjpj.tk',
        subject: 'STJJ.AIC アカウント作成手続き',
        text: html,
        html: html,
    };
    sgMail.send(msg).then(() => {
        res.status(200).json({ result: "ok" }).send()
    }).catch((reason) => {
        logger.error(reason);
        res.status(500).json({ result: "ng" }).send()
    });
}

export function postSignupPassword(req: Request, res: Response) {

    const reserved = signupDeque(req.body.token)
    if (reserved) {
        // 正式にDB登録
        accountCreate(reserved.username, reserved.email, req.body.password)
        .then(account => {
            (req.session as any).account = account; // 登録OKなのでセッションに格納
            sessionService.addSession(req.session);
            res.status(200).json({ result: "ok" }).send();
        })
        .catch(() => {
            res.status(500).json({ result: "ng" }).send();
        });
    } else {
        logger.error("トークンのマッチングに失敗");
        res.status(500).json({ result: "ng" }).send();
    }

}

export function postAccountDelete(req: Request, res: Response) {

    accountDelete((req.session as any).account._id, req.body.password).then(() => {
        req.session.destroy(()=>{
            res.status(200).json({ result: "ok" }).send();
        });
    }
    ).catch(() => {
        res.status(500).json({ result: "ng" }).send();
    })

}


export function postPasswordReset(req: Request, res: Response) {

    const token = uuidv4()
    const html = 'STJJ.AICのパスワード再登録が申請されました。<br>正式にパスワード再登録するには、次のリンクを押して新しいパスワードを登録していただく必要があります。<br><a href="' + BASE_URL_FRONT + '/#/password-reset-new?token=' + token + '">STJJ.AIC パスワード再登録</a><br>※本メールに心当たりのない場合はお手数ですが本メールの破棄をお願いします。'

    passwordResetEnqueue({ email: req.body.email,  id: token })

    const msg = {
        to: req.body.email,
        from: 'noreply@mail.scptcgjpj.tk',
        subject: 'STJJ.AIC パスワード再登録手続き',
        text: html,
        html: html,
    };
    sgMail.send(msg).then(() => {
        res.status(200).json({ result: "ok" }).send()
    }).catch((reason) => {
        logger.error(reason);
        res.status(500).json({ result: "ng" }).send()
    });
}

export function postPasswordResetNew(req: Request, res: Response) {
    const reserved = passwordResetDeque(req.body.token)
    if (reserved) {
        // 正式にDB登録
        passwordReset(reserved.email, req.body.password)
        .then(account => {
            res.status(200).json({ result: "ok" }).send();
        })
        .catch(() => {
            res.status(500).json({ result: "ng" }).send();
        });
    } else {
        logger.error("トークンのマッチングに失敗");
        res.status(500).json({ result: "ng" }).send();
    }
}


export function postEmailChange(req: Request, res: Response) {

    const token = uuidv4()
    const html = 'STJJ.AICのメールアドレス変更が申請されました。<br>正式にメールアドレス変更するには、次のリンクを押して新しいパスワードを登録していただく必要があります。<br><a href="' + BASE_URL_FRONT + '/#/email-change-new?token=' + token + '">STJJ.AIC メールアドレス変更</a><br>※本メールに心当たりのない場合はお手数ですが本メールの破棄をお願いします。'

    emailChangeEnqueue({ currentEmail: (req.session as any).account.email, newEmail: req.body.email, id: token })

    const msg = {
        to: req.body.email,
        from: 'noreply@mail.scptcgjpj.tk',
        subject: 'STJJ.AIC メールアドレス変更手続き',
        text: html,
        html: html,
    };
    sgMail.send(msg).then(() => {
        res.status(200).json({ result: "ok" }).send()
    }).catch((reason) => {
        logger.error(reason);
        res.status(500).json({ result: "ng" }).send()
    });
}

export function postEmailChangeNew(req: Request, res: Response) {
    const reserved = emailChangeDeque(req.body.token)
    if (reserved) {
        // 正式にDB登録
        emailChange(reserved.currentEmail, reserved.newEmail)
        .then(() => {
            (req.session as any).account.email = reserved.newEmail;
            res.status(200).json({ result: "ok" }).send();
        })
        .catch(() => {
            res.status(500).json({ result: "ng" }).send();
        });
    } else {
        logger.error("トークンのマッチングに失敗");
        res.status(500).json({ result: "ng" }).send();
    }
}