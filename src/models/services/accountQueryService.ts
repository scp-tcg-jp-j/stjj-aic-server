import { Account } from './../account';
import { accountDb } from "../../dao";
// todo: ユーザー系とサービスを統一する（実質同じものなので）

// todo: 見付からない場合はエラーではなくnullを返すようにする
export async function findOneAccount(_id: string) {
    return new Promise<Account>((resolve: (account: Account) => any, reject: (error: Error) => any) => {
        const query = {
            $and: [
                { _id: _id },
                { banned: false },
                { $not: { deleted: true } }
            ]
        }
        accountDb.findOne(query, { password: 0 }, function (errorOfFind: Error | null, account: Account | null) {
            if (errorOfFind) {
                console.log(errorOfFind);
                return reject(errorOfFind);
            }

            if (account == null) {
                console.log("account not found")
                return reject(new Error("account not found"))
            }

            return resolve(account);
        })
    })
}

export async function findOneAccountByEmail(email: string) {
    return new Promise<Account | null>((resolve: (account: Account | null) => any, reject: (error: Error) => any) => {
        const query = {
            $and: [
                { email: email },
                { banned: false },
                { $not: { deleted: true } }
            ]
        }
        accountDb.findOne(query, { password: 0 }, function (errorOfFind: Error | null, account: Account | null) {
            if (errorOfFind) {
                console.log(errorOfFind);
                return reject(errorOfFind);
            }

            if (account == null) {
                return resolve(null)
            }

            return resolve(account);
        })
    })
}

export async function findOneAccountByUsername(username: string) {
    return new Promise<Account | null>((resolve: (account: Account | null) => any, reject: (error: Error) => any) => {
        const query = {
            $and: [
                { username: username },
                { banned: false },
                { $not: { deleted: true } }
            ]
        }
        accountDb.findOne(query, { password: 0 }, function (errorOfFind: Error | null, account: Account | null) {
            if (errorOfFind) {
                console.log(errorOfFind);
                return reject(errorOfFind);
            }

            if (account == null) {
                return resolve(null)
            }

            return resolve(account);
        })
    })
}