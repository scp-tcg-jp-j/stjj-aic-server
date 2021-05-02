import { Account } from './../account';
import { accountDb } from "../../dao";

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