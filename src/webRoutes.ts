import { upsertPostSignupPasswordValidator, upsertPostSignupValidator } from './controllers/web/account/Validators';
import { Router } from 'express';
import { postAccountDelete, postEmailChange, postEmailChangeNew, postPasswordChange, postPasswordReset, postPasswordResetNew, postSignup, postSignupPassword, postUsernameChange } from './controllers/web/account/account-controller';
import { postAllUsers, postEditUsers } from './controllers/web/admin/UserManagerController';
import { postLogin, postLogout, postSession } from './controllers/web/authentication/AuthenticationController';
import { postFindCards } from './controllers/web/cards/SearchCardController';
import { getConnectivityCheck, postConnectivityCheck } from './controllers/web/debug/ConnectivityCheckController';

// ルート設定
export function configRoutes(router: Router) {
    // 接続確認（GET）
    router.get('/connectivity', getConnectivityCheck)
    // 接続確認（POST）
    router.post('/connectivity', postConnectivityCheck)
    // カード検索（POST）
    router.post('/search_cards', postFindCards)

    // ログイン（POST）
    router.post('/login', postLogin)
    router.post('/session', postSession)
    router.post('/logout', postLogout)

    // アカウント系
    router.post('/username-change', postUsernameChange)
    router.post('/password-change', postPasswordChange)
    router.post('/account-delete', postAccountDelete)
    router.post('/signup', upsertPostSignupValidator, postSignup)
    router.post('/signup_password', upsertPostSignupPasswordValidator, postSignupPassword)
    router.post('/account_delete', postAccountDelete)
    router.post('/password_reset', postPasswordReset)
    router.post('/password_reset_new', postPasswordResetNew)
    router.post('/email_change', postEmailChange)
    router.post('/email_change_new', postEmailChangeNew)

    // 管理者用ルート
    router.post('/admin/users', postAllUsers)
    router.post('/admin/edit_users', postEditUsers)
}