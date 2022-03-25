import { ERROR_AUTHENTICATION_FAILED } from './../../constants';
import { Account } from './../account';
import { LoginInfo } from './../loginInfo';
import { accountDb } from './../../dao';
import bcrypt from 'bcrypt';

// ログイン用

export async function login(loginInfo: LoginInfo) {
    return new Promise<Account>((resolve: (account: Account) => any, reject: (error: Error) => any) => {

        // 検索条件。メアドかユーザー名が当たりかつパスワードが当たりのアカウントを取得
        // 結果は高々1件になるはず
        const query = {
            $and: [
                {
                    $or: [
                        { email: loginInfo.usernameOrEmail },
                        { username: loginInfo.usernameOrEmail },
                    ]
                },
                { banned: false },
                { $not: { deleted: true } },
                { $where: function () { return bcrypt.compareSync(loginInfo.password, (this as unknown as { password: string }).password ); } }
            ]
        };

        // 検索のコールバック
        const afterFind = async function (errorOfFind: Error | null, account: Account | null) {
            if (errorOfFind) {
                // 異常系
                return reject(errorOfFind);
            }

            if (account == null) {
                // メアドかユーザー名かパスワードが間違っている場合
                return reject(ERROR_AUTHENTICATION_FAILED);
            }

            return resolve(account);
        };

        // 検索実行。パスワードが漏れてはいけないので射影で落とす
        accountDb.findOne(query, { password: 0 }, afterFind);
    });
}

























