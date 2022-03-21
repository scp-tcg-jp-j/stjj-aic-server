import { NG_USERNAMES, MESSAGE_NG_USERNAME, MESSAGE_IS_STRING, MESSAGE_MALFORMED_USERNAME, MESSAGE_REQUIRED, MESSAGE_IS_EMAIL } from './../../../constants';
import { body } from 'express-validator';
import { findOneAccountByEmail } from '../../../models/services/accountQueryService';

export const upsertPostSignupValidator = [
    body('email').notEmpty().withMessage(MESSAGE_REQUIRED),
    body('email').isEmail().withMessage(MESSAGE_IS_EMAIL),
    body('email').custom(email => {
        return true;
/*         let waiting = true
        let alreadyUsed
        while (waiting) {
            findOneAccountByEmail(email).then(maybeAccount => {
                if (maybeAccount) {
                    alreadyUsed = true
                } else {
                    alreadyUsed = false
                }

                waiting = false
            })
            setTimeout(() => {}, 100)
        }

        return !alreadyUsed */
    }),
    body('username').notEmpty().withMessage(MESSAGE_REQUIRED),
    // ユーザー名のNGリストを確認
    body('username').not().isIn(NG_USERNAMES).withMessage(MESSAGE_NG_USERNAME),
    // ユーザー名が文字列であることを確認
    body('username').isString().withMessage(MESSAGE_IS_STRING),
    // ユーザー名が半角英数字とアンダーバーのみからなるか確認
    body('username').escape().matches(/[0-9a-zA-Z\_]+/).withMessage(MESSAGE_MALFORMED_USERNAME),
    // todo: 登録手続き中でないことの確認（正式登録完了前に別の人が登録してしまうのを防止するため）
]
