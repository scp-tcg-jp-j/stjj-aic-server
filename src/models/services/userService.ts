import { sessionService } from './sessionService';
import { ERROR_AUTHENTICATION_FAILED } from './../../constants';
import { Account } from './../account';
import { accountDb } from './../../dao';
import bcrypt from 'bcrypt';

// ログイン用

export async function findAllUsers() {
    return new Promise<Account[]>((resolve: (account: Account[]) => any, reject: (error: Error) => any) => {

        // 検索実行。パスワードが漏れてはいけないので射影で落とす
        accountDb.find({ $not: { deleted: true } }, { password: 0 }).sort("created").exec(function (errorOfFind: Error | null, accounts: Account[] | null) {
            if (errorOfFind) {
                // 異常系
                return reject(errorOfFind);
            }

            if (accounts == null) {
                // 異常系
                return reject(new Error("ERROR: result accounts is null"));
            }

            return resolve(accounts);
        });
    });
}

type UserChange = { targetId: string, banned: boolean } | { targetId: string, role: string }
export async function editUsers(changes: UserChange[]) {

    const promises = changes.map(change => 
        new Promise<void>((resolve: () => any, reject: (error: Error) => any) => {

            const changeObject = 'role' in change ? { $set: { role: change.role } } : { $set: { banned: change.banned }};
            accountDb.update({ _id: change.targetId }, changeObject, {}, function(errorOfUpdate) {
                if (errorOfUpdate) {
                    console.log(errorOfUpdate);
                    return reject(errorOfUpdate);
                }

                console.log("アカウント更新成功");
                accountDb.persistence.compactDatafile();
                return resolve();
            });
        })
    );

    // 権限変更したのでセッション破棄
    changes.forEach(change => {
        sessionService.killSessionByUserId(change.targetId);
    });

    return Promise.allSettled(promises);

}
