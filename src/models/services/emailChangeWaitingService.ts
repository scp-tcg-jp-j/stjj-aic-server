import AsyncLock from 'async-lock';

// メアド変更手続き中リスト
let emailChangeWaitingList: { currentEmail: string, newEmail: string, id: string}[] = [];
const key  = "emailChangeWaiting"; // 排他制御のキー
const lock = new AsyncLock();      // 排他制御オブジェクト

// メアド変更手続き中リストへの追加
export async function addEmailChangeWaiting(item: { currentEmail: string, newEmail: string, id: string}) {
    return lock.acquire(key, function() {
        // 既に手続き中リストに登録されていたらエラー
        if (checkAlreadyExists(item.newEmail)) {
            throw new Error("new email already exists.");
        }
        emailChangeWaitingList.push(item);
    });
}

// メアド変更手続き中リストからの削除
export async function removeEmailChangeWaiting(id: string) {
    return lock.acquire(key, function() {
        const reserved = emailChangeWaitingList.find(item => item.id == id);
        if (!reserved) {
            throw new Error("id not matched.");
        }
        emailChangeWaitingList = emailChangeWaitingList.filter(item => item.id != id);
        return reserved;
    });
}

// 既に手続き中か否か（チェックしてもぶつかるときはぶつかるが、バリデータで使いたい。ないよりマシ）
export function checkAlreadyExists(newEmail: string) {
    return emailChangeWaitingList.some(item => item.newEmail == newEmail);
}