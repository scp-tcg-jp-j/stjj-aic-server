import { Session } from "express-session"
import { accountDb } from "../../dao";

class SessionService {
    private sessions: Session[]  = []

    public addSession(session: Session) {
        this.sessions.push(session);
    }

    // セッションの破棄は手動
    public removeOneSession(sid: string) {
        this.sessions = this.sessions.filter(session => session.id != sid);
    }

    // セッションの破棄はこちらでやってる
    public killSessionByUserId(_id: string) {
        // todo: 排他制御ちゃんとやる
        const target = this.sessions.filter(session => (session as any).account?._id == _id);
        this.sessions = this.sessions.filter(session => (session as any).account?.id != _id);
        target.forEach(session => session.destroy(() => {}))
    }

    // アカウント情報弄った後にセッションに反映
    public reloadAccountForAllSessions(_id: string) {
        accountDb.findOne({ _id: _id }, { password: 0 }, (err: Error | null, account: Account | null) => {
            if (err) {
                // todo: 異常系を考える
                console.log(err)
                return false;
            }

            if (account == null) {
                // todo: 異常系を考える
                console.log("account is null(sessionService)")
                return false;
            }
            this.sessions.filter(session => (session as any).account?._id == _id).forEach(
                session => {
                    (session as any).account = account
                }
            )

            return true;
        })
    }
}

export const sessionService = new SessionService()