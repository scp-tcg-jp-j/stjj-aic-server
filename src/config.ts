import fs from 'fs';

type ConfigType = {
    mail: {
        gas: string,
        token: string
    }
};

let config: ConfigType | null = null;

export function getConfig(): ConfigType {
    if (config != null) {
        return config;
    }

    // todo: パスをコマンドライン引数から受け取れるようにする
    // todo: 文字コードフリーにする
    // todo: パースエラーのハンドリング
    const raw = fs.readFileSync('/home/stjj-aic/saconfig.json', 'utf-8');
    config = JSON.parse(raw);

    return config!!;
}