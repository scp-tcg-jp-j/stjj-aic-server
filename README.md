# stjj-aic-server

# 開発の準備
Node.jsをインストールする（Webアプリとフロントエンドの開発に使うため）  
VirtualBoxをインストールする（本番環境を模した環境のVMでWebアプリやFANDOMカード同期Pythonを実行するため）  
Vagrantをインストールする（同上）  
vagrant-vbguestをインストールする（先述のVM内に開発したソースコードを共有するため。vagrant plugin install vagrant-vbguestを実行することで入れられる）  
何か適当なフォルダで以下を実行する  
mkdir repo  
cd repo  
git clone git@github.com:scp-tcg-jp-j/stjj-aic-server.git  
cd stjj-aic-server  
git fetch origin 【ブランチ名】  
git checkout 【ブランチ名】  
npm install
※上記のブランチ名は開発対象で適宜決める。カード検索機能はcard-searchブランチで実装中  
cd ..  
git clone git@github.com:scp-tcg-jp-j/stjj-aic-vm vagrant  
cd vagrant  
vagrant up  
vagrant ssh  
※最後まで成功するとSTJJ.AICをローカル環境で実行するためのVMにログインしているはず  
※PCを終了するときはVMでexitとタイプしてVMから離脱し、vagrant haltでVMを停止する。
# ローカル環境でのWebアプリケーションのビルド
先述のVM内で以下を実行する  
cp -r /home/vagrant/repo/stjj-aic-server/src /var/www/stjj-aic-server  
cp /home/vagrant/repo/stjj-aic-server/package.json /var/www/stjj-aic-server/package.json  
cp /home/vagrant/repo/stjj-aic-server/tsconfig.json /var/www/stjj-aic-server/tsconfig.json  
cd /var/www/stjj-aic-server  
npm install  
npx -p typescript tsc  
# ローカル環境でのWebアプリケーションの実行
先述のビルドを実行したうえで、先述のVM内で以下を実行する  
nohup sudo -b -u stjj-aic /opt/.nvm/versions/node/v14.15.5/bin/node /var/www/stjj-aic-server/serve/src/index.js --env=local &  
# ローカル環境でのFANDOMカード同期Pythonの実行
todo: 詳細未定  
おそらく/home/vagrant/repo/stjj-aic-server/pythonを/var/www/stjj-aic-server/pythonにコピーして何かする？  
# ローカル環境でのWebアプリケーションの停止
VM内で以下を実行する  
ps aux | grep node  
上記で得たnodeのPIDを以下で殺す（※sudoがついてない方のPID）  
sudo kill -9 【PID】  
# VM内のNeDBのファイルを取り出す
VM内のNeDBのファイルは/home/stjj-aic/nedbディレクトリに存在する。
cp -r /home/stjj-aic/nedb /vagrant/nedb
を実行すればホスト側のvagrantのディレクトリに取り出しできる。

# URL台帳（Webアプリ）
ローカル環境の場合は https://localhost の後ろに以下を付ける  
本番環境の場合は https://api.scptcgjpj.ga の後ろに以下を付ける  
* /connectivity
  * 接続確認用
  * GET: リクエストパラメータをオウム返しする（はず）
  * POST: リクエストボディをオウム返しする（はず）

# URL台帳（FANDOMカード同期）
ローカルでも本番でも http://localhost:55000 の後ろに以下を付ける（サーバー内で通信が完結するため）  
* /upsert
  * カード追加・カード更新用（1枚）
  * POST: ディスカで話したフォーマット（のはず）
* /bulk_delete
  * カード削除用
  * POST: ディスカで話したフォーマット（のはず）
* /current_cards
  * 現在DBに存在するカードの一覧
  * GET: パラメータ必要なし

# todo
* とりあえずカード取り込みを動かしてみて確認
* 実行オプションをちゃんと考える（--env=localと--env=prodは適当に入れた。nodeのargvの扱いがよく分かってないから調べること）
* ログをどうするか考える（ファイルでログローテのつもり）
* NeDBはトランザクション張れないのでせめて復旧できるようにログを出す。
* 排他制御。mutexか何か持たせればいいか？
* コメント少ないから書くこと
* 上記の手順は環境構築に属する。「開発の手引き」みたいなのが欲しい
* 上記の手順を毎回やるのは煩雑なのでinitialize、build、runみたいなコマンドを.batや.shで作る