import { Account } from './../account';
import { sessionService } from './sessionService';
import bcrypt from "bcrypt";

import { accountDb } from "../../dao"

// アカウント作成
export async function accountCreate(username: string, email: string, password: string) {
    return new Promise<Account>((resolve: (account: Account) => any, reject: (error: Error) => any) => {
        const account = {
            "username": username,
            "email": email,
            "password": bcrypt.hashSync(password, 10),
            "role": "user",
            "banned": false,
            "created": new Date(),
        }

        accountDb.insert(account as any, function (errorOfInsert: Error | null, newAccount: Account) {
            if (errorOfInsert) {
                console.log(errorOfInsert);
                return reject(errorOfInsert);
            }

            accountDb.persistence.compactDatafile();
            delete (newAccount as any).password
            return resolve(newAccount)
        })
    })
}

// メアド変更
let emailChangeQueue: { currentEmail: string, newEmail: string, id: string }[] = [];
export function emailChangeEnqueue(item: { currentEmail: string, newEmail: string, id: string}) {
    emailChangeQueue.push(item)
}
export function emailChangeDeque(id: string) {
    const item = emailChangeQueue.find(queueItem => queueItem.id == id)
    if (item) {
        // アイテム除去
        emailChangeQueue = emailChangeQueue.filter(queueItem => queueItem.id != id)
        return item;
    } else {
        return null;
    }
}
export async function emailChange(targetEmail: string, newEmail: string) {
    return new Promise<void>((resolve: () => any, reject: (error: Error) => any) => {
        const query = {
            $and: [
                { email: targetEmail },
                { banned: false },
                { $not: { deleted: true } }
            ]
        }
        accountDb.update(query, { $set: { email: newEmail }}, {}, function (errorOfUpdate) {
            if (errorOfUpdate) {
                console.log(errorOfUpdate);
                return reject(errorOfUpdate);
            }

            console.log("メアドリセット成功")
            accountDb.persistence.compactDatafile();
            return resolve();
        })
    })
}


// ユーザー名変更
export async function usernameChange(change: { targetId: string, username: string }) {
    return new Promise<void>((resolve: () => any, reject: (error: Error) => any) => {
        accountDb.update({ _id: change.targetId }, { $set: { username: change.username }}, {}, function (errorOfUpdate) {
            if (errorOfUpdate) {
                console.log(errorOfUpdate);
                return reject(errorOfUpdate);
            }

            console.log("ユーザー名変更成功")
            accountDb.persistence.compactDatafile();
            sessionService.reloadAccountForAllSessions(change.targetId);
            return resolve();
        })
    })
}
// パスワード変更
export async function passwordChange(change: { targetId: string, currentPassword: string, newPassword: string }) {
    return new Promise<void>((resolve: () => any, reject: (error: Error) => any) => {
        accountDb.findOne({
            $and: [
                { _id: change.targetId },
                { $where: function () { return bcrypt.compareSync(change.currentPassword, (this as unknown as { password: string }).password ) } }
            ]
        }, function(errorOfFind: Error | null, account: Account | null){
            if (errorOfFind) {
                console.log(errorOfFind);
                return reject(errorOfFind);
            }

            if (account == null) {
                // todo: 異常系
                console.log("result null in passwordChange");
                return reject(new Error("result null in passwordChange"));
            }

            accountDb.update({ _id: change.targetId }, { $set: { password: bcrypt.hashSync(change.newPassword, 10) }}, {}, function (errorOfUpdate) {
                if (errorOfUpdate) {
                    console.log(errorOfUpdate);
                    return reject(errorOfUpdate);
                }
    
                console.log("パスワード変更成功")
                accountDb.persistence.compactDatafile();
                return resolve();
            })
        });
    })
}
// アカウント削除（論理削除）
export async function accountDelete(targetId: string, password: string) {
    return new Promise<void>((resolve: () => any, reject: (error: Error) => any) => {
        const query = {
            $and: [
                { _id: targetId },
                { $where: function () { return bcrypt.compareSync(password, (this as unknown as { password: string }).password ) } }
            ]
        }
        accountDb.update(query, { $set: { deleted: true } }, {}, function (errorOfUpdate) {
            if (errorOfUpdate) {
                console.log(errorOfUpdate);
                return reject(errorOfUpdate);
            }

            console.log("アカウント削除成功")
            accountDb.persistence.compactDatafile();
            // セッション破棄
            sessionService.killSessionByUserId(targetId)
            return resolve();
        })
    })
}

let signupQueue: { email: string, username: string, id: string }[] = [];
export function signupEnqueue(item: { email: string, username: string, id: string}) {
    signupQueue.push(item)
}
export function signupDeque(id: string) {
    const item = signupQueue.find(queueItem => queueItem.id == id)
    if (item) {
        // アイテム除去
        signupQueue = signupQueue.filter(queueItem => queueItem.id != id)
        return item;
    } else {
        return null;
    }
}

let passwordResetQueue: { email: string, id: string }[] = [];
export function passwordResetEnqueue(item: { email: string, id: string }) {
    passwordResetQueue.push(item)
}
export function passwordResetDeque(id: string) {
    const item = passwordResetQueue.find(queueItem => queueItem.id == id)
    if (item) {
        // アイテム除去
        passwordResetQueue = passwordResetQueue.filter(queueItem => queueItem.id != id)
        return item;
    } else {
        return null;
    }
}
// パスワードリセット
export async function passwordReset(targetEmail: string, newPassword: string) {
    return new Promise<void>((resolve: () => any, reject: (error: Error) => any) => {
        const query = {
            $and: [
                { email: targetEmail },
                { banned: false },
                { $not: { deleted: true } }
            ]
        }
        accountDb.update(query, { $set: { password: bcrypt.hashSync(newPassword, 10) }}, {}, function (errorOfUpdate) {
            if (errorOfUpdate) {
                console.log(errorOfUpdate);
                return reject(errorOfUpdate);
            }

            console.log("パスワードリセット成功")
            accountDb.persistence.compactDatafile();
            return resolve();
        })
    })
}

